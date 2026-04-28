import { Injectable, NestMiddleware, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CompaniesService } from '../../companies/companies.service';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';
import { UserRole } from '../../auth/entities/user.entity';

type JwtUser = {
  userId: number;
  email: string;
  role: UserRole;
  companyId?: number;
};

@Injectable()
export class CompanyMiddleware implements NestMiddleware {
  constructor(private readonly companiesService: CompaniesService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as User | JwtUser | undefined;
    
    // Determine company ID from: header > JWT > user.entity
    let companyId: number | undefined;
    
    // 1. Check X-Company-ID header (for admin actions on other companies)
    if (req.headers['x-company-id']) {
      companyId = parseInt(req.headers['x-company-id'] as string, 10);
    }
    
    // 2. Check JWT payload
    if (!companyId && (user as JwtUser)?.companyId) {
      companyId = (user as JwtUser).companyId;
    }
    
    // 3. Check User entity
    if (!companyId && (user as User)?.company?.id) {
      companyId = (user as User).company.id;
    }

    // If no company ID determined, allow the request to proceed
    // (public endpoints, auth endpoints, etc.)
    if (!companyId) {
      return next();
    }

    // Validate company exists and is active
    const company = await this.companiesService.findOne(companyId);
    
    if (!company) {
      throw new NotFoundException(`Company #${companyId} not found`);
    }

    if (!company.isActive) {
      throw new ForbiddenException(`Company #${companyId} is not active`);
    }

    // Check if user has permission to access this company
    const userId = (user as User)?.id || (user as JwtUser)?.userId;
    const userCompanyId = (user as User)?.company?.id || (user as JwtUser)?.companyId;
    
    // If user is not a superadmin and trying to access a different company
    const userRole = (user as User)?.role || (user as JwtUser)?.role;
    const isSuperAdmin = userRole === UserRole.SUPERADMIN;
    
    if (userId && !isSuperAdmin && userCompanyId !== companyId) {
      throw new ForbiddenException(
        `You do not have permission to access Company #${companyId}`
      );
    }

    // Attach company to request
    (req as Request & { company?: Company }).company = company;
    (req as Request & { companyId?: number }).companyId = companyId;

    next();
  }
}
