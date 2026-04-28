import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Notification, NotificationType, NotificationChannel } from './entities/notification.entity';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../auth/users.service';
import { CustomersService } from '../customers/customers.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const company = await this.companiesService.findOne(createNotificationDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company #${createNotificationDto.companyId} not found`);
    }

    let user: any = null;
    let customer: any = null;

    if (createNotificationDto.userId) {
      user = await this.usersService.findOne(createNotificationDto.userId);
    }

    if (createNotificationDto.customerId) {
      customer = await this.customersService.findOne(createNotificationDto.customerId);
    }

    const notification = new Notification();
    notification.companyId = createNotificationDto.companyId;
    notification.company = company;
    notification.userId = createNotificationDto.userId as any;
    notification.user = user as any;
    notification.customerId = createNotificationDto.customerId as any;
    notification.customer = customer as any;
    notification.type = createNotificationDto.type;
    notification.title = createNotificationDto.title;
    notification.message = createNotificationDto.message;
    notification.data = createNotificationDto.data as any;
    notification.isRead = createNotificationDto.isRead || false;
    notification.sentVia = createNotificationDto.sentVia || [];
    notification.sentAt = (createNotificationDto.sentVia && createNotificationDto.sentVia.length > 0) ? new Date() as any : null as any;

    const savedNotification = await this.notificationsRepository.save(notification);

    this.logger.log(`Notification created: ${notification.title} for company ${company.id}`);

    return savedNotification;
  }

  async findAll(
    companyId?: number,
    userId?: number,
    customerId?: number,
    type?: NotificationType,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const options: any = {
      relations: ['company', 'user', 'customer'],
      order: { createdAt: 'DESC' },
    };

    const where: any[] = [];
    if (companyId) where.push({ companyId });
    if (userId) where.push({ userId });
    if (customerId) where.push({ customerId });
    if (type) where.push({ type });
    if (isRead !== undefined) where.push({ isRead });

    if (where.length > 0) {
      options.where = where.length === 1 ? where[0] : where;
    }

    return this.notificationsRepository.find(options);
  }

  async findOne(id: number): Promise<Notification | null> {
    return this.notificationsRepository.findOne({
      where: { id },
      relations: ['company', 'user', 'customer'],
    });
  }

  async findUnread(userId?: number, customerId?: number, companyId?: number): Promise<Notification[]> {
    const where: any[] = [{ isRead: false }];
    if (userId) where.push({ userId });
    if (customerId) where.push({ customerId });
    if (companyId) where.push({ companyId });

    return this.notificationsRepository.find({
      where: where.length === 1 ? where[0] : where,
      relations: ['company', 'user', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      relations: ['company', 'user', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { customerId },
      relations: ['company', 'user', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }

    notification.isRead = true;
    notification.readAt = new Date() as any;

    await this.notificationsRepository.save(notification);

    this.logger.log(`Notification marked as read: ${id}`);

    return notification;
  }

  async markAllAsRead(userId?: number, customerId?: number, companyId?: number): Promise<{ updated: number }> {
    const where: any = { isRead: false };
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;
    if (companyId) where.companyId = companyId;

    const result = await this.notificationsRepository.update(where, {
      isRead: true,
      readAt: new Date(),
    });

    this.logger.log(`Marked ${result.affected} notifications as read`);

    return { updated: result.affected || 0 };
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }

    const dto = updateNotificationDto as any;
    delete dto.companyId;
    delete dto.userId;
    delete dto.customerId;
    delete dto.type;
    delete dto.title;
    delete dto.message;

    Object.assign(notification, dto);

    await this.notificationsRepository.save(notification);

    return notification;
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }

    await this.notificationsRepository.delete(id);

    this.logger.log(`Notification deleted: ${id}`);
  }

  async getStats(companyId: number, days: number = 30): Promise<{
    total: number;
    unread: number;
    byType: { type: string; count: number }[];
    byChannel: { channel: string; count: number }[];
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [total, unread, allNotifications] = await Promise.all([
      this.notificationsRepository.count({ where: { companyId, createdAt: MoreThan(fromDate) } }),
      this.notificationsRepository.count({ where: { companyId, isRead: false, createdAt: MoreThan(fromDate) } }),
      this.notificationsRepository.find({
        where: { companyId, createdAt: MoreThan(fromDate) },
        select: ['type', 'sentVia', 'isRead'],
      }),
    ]);

    const byType = new Map<string, number>();
    const byChannel = new Map<string, number>();

    for (const n of allNotifications) {
      byType.set(n.type, (byType.get(n.type) || 0) + 1);
      for (const channel of n.sentVia || []) {
        byChannel.set(channel, (byChannel.get(channel) || 0) + 1);
      }
    }

    return {
      total,
      unread,
      byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })),
      byChannel: Array.from(byChannel.entries()).map(([channel, count]) => ({ channel, count })),
    };
  }

  async sendEmailNotification(
    companyId: number,
    to: string,
    subject: string,
    body: string,
    data?: any,
    userId?: number,
    customerId?: number,
  ): Promise<Notification> {
    const notification = new Notification();
    notification.companyId = companyId;
    notification.company = { id: companyId } as any;
    notification.userId = userId as any;
    notification.customerId = customerId as any;
    notification.type = NotificationType.INVOICE;
    notification.title = subject;
    notification.message = body;
    notification.data = data as any;
    notification.isRead = false;
    notification.sentVia = [NotificationChannel.EMAIL];
    notification.sentAt = new Date() as any;

    const savedNotification = await this.notificationsRepository.save(notification);

    this.logger.log(`Email notification queued: ${subject} for company ${companyId}`);

    return savedNotification;
  }

  async sendSmsNotification(
    companyId: number,
    to: string,
    message: string,
    data?: any,
    userId?: number,
    customerId?: number,
  ): Promise<Notification> {
    const notification = new Notification();
    notification.companyId = companyId;
    notification.company = { id: companyId } as any;
    notification.userId = userId as any;
    notification.customerId = customerId as any;
    notification.type = NotificationType.PAYMENT;
    notification.title = 'SMS Notification';
    notification.message = message;
    notification.data = data as any;
    notification.isRead = false;
    notification.sentVia = [NotificationChannel.SMS];
    notification.sentAt = new Date() as any;

    const savedNotification = await this.notificationsRepository.save(notification);

    this.logger.log(`SMS notification queued: ${message} for company ${companyId}`);

    return savedNotification;
  }
}
