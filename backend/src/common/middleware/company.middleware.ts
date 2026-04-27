import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CompaniesService } from '../../companies/companies.service';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';

type JwtUser = {
  userId: number;
  email: string;
  role: string;
  companyId?: number;
};

@Injectable()
export class CompanyMiddleware implements NestMiddleware {
  constructor(private readonly companiesService: CompaniesService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as User | JwtUser | undefined;
    const companyId = req.headers['x-company-id'] || 
      (user as JwtUser)?.companyId || 
      (user as User)?.company?.id;
    
    if (companyId) {
      const company = await this.companiesService.findOne(+companyId);
      if (company) {
        (req as Request & { company?: Company }).company = company;
      }
    }
    next();
  }
}
