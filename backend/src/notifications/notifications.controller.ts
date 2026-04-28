import { Controller, Get, Post, Body, Param, Delete, Put, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ type: Notification, description: 'Created notification' })
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all notifications' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiResponse({ type: [Notification], description: 'List of notifications' })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('userId') userId?: number,
    @Query('customerId') customerId?: number,
    @Query('type') type?: string,
    @Query('isRead') isRead?: boolean,
  ): Promise<Notification[]> {
    return this.notificationsService.findAll(companyId, userId, customerId, type as any, isRead);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Notification, description: 'Notification details' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Notification | null> {
    return this.notificationsService.findOne(id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ type: [Notification], description: 'List of unread notifications' })
  async findUnread(
    @Query('userId') userId?: number,
    @Query('customerId') customerId?: number,
    @Query('companyId') companyId?: number,
  ): Promise<Notification[]> {
    return this.notificationsService.findUnread(userId, customerId, companyId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications by user' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiResponse({ type: [Notification], description: 'User notifications' })
  async findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Notification[]> {
    return this.notificationsService.findByUser(userId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get notifications by customer' })
  @ApiParam({ name: 'customerId', type: Number })
  @ApiResponse({ type: [Notification], description: 'Customer notifications' })
  async findByCustomer(@Param('customerId', ParseIntPipe) customerId: number): Promise<Notification[]> {
    return this.notificationsService.findByCustomer(customerId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Notification, description: 'Updated notification' })
  async markAsRead(@Param('id', ParseIntPipe) id: number): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiResponse({ description: 'Mark all result' })
  async markAllAsRead(
    @Query('userId') userId?: number,
    @Query('customerId') customerId?: number,
    @Query('companyId') companyId?: number,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAllAsRead(userId, customerId, companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ type: Notification, description: 'Updated notification' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.notificationsService.remove(id);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiParam({ name: 'companyId', type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days of data to analyze' })
  @ApiResponse({ description: 'Notification statistics' })
  async getStats(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('days') days: number = 30,
  ): Promise<any> {
    return this.notificationsService.getStats(companyId, days);
  }

  @Post('email')
  @ApiOperation({ summary: 'Send email notification' })
  @ApiResponse({ type: Notification, description: 'Created email notification' })
  async sendEmail(
    @Body('companyId') companyId: number,
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
    @Body('data') data?: any,
    @Body('userId') userId?: number,
    @Body('customerId') customerId?: number,
  ): Promise<Notification> {
    return this.notificationsService.sendEmailNotification(
      companyId,
      to,
      subject,
      body,
      data,
      userId,
      customerId,
    );
  }

  @Post('sms')
  @ApiOperation({ summary: 'Send SMS notification' })
  @ApiResponse({ type: Notification, description: 'Created SMS notification' })
  async sendSms(
    @Body('companyId') companyId: number,
    @Body('to') to: string,
    @Body('message') message: string,
    @Body('data') data?: any,
    @Body('userId') userId?: number,
    @Body('customerId') customerId?: number,
  ): Promise<Notification> {
    return this.notificationsService.sendSmsNotification(
      companyId,
      to,
      message,
      data,
      userId,
      customerId,
    );
  }
}
