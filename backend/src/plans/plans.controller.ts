import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanBillingCycle, PlanType } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all plans' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('activeOnly') activeOnly?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    let plans = activeOnly
      ? companyId ? await this.plansService.findActiveByCompany(companyId) : await this.plansService.findActiveByCompany(1)
      : companyId ? await this.plansService.findAll(companyId) : await this.plansService.findAll();

    const pageNum = page || 1;
    const limitNum = limit || 100;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    const paginated = plans.slice(start, end);

    return {
      data: paginated,
      total: plans.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(plans.length / limitNum),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(+id);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all plans for a company' })
  @ApiParam({ name: 'companyId', type: Number })
  findByCompany(@Param('companyId') companyId: string) {
    return this.plansService.findByCompany(+companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(+id, updatePlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.plansService.remove(+id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a plan' })
  @ApiParam({ name: 'id', type: Number })
  activate(@Param('id') id: string) {
    return this.plansService.activate(+id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a plan' })
  @ApiParam({ name: 'id', type: Number })
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(+id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder plans (update sort order)' })
  reorder(@Body() body: { planIds: number[] }) {
    return this.plansService.reorder(body.planIds);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get plan statistics' })
  @ApiParam({ name: 'id', type: Number })
  async getStats(@Param('id') id: string) {
    const plan = await this.plansService.findOne(+id);
    if (!plan) {
      return { error: 'Plan not found' };
    }

    const radiusUsersCount = plan.radiusUsers?.length || 0;
    const vouchersCount = plan.vouchers?.length || 0;
    const invoicesCount = plan.invoices?.length || 0;

    return {
      planId: plan.id,
      name: plan.name,
      activeCustomers: radiusUsersCount,
      activeVouchers: vouchersCount,
      totalInvoices: invoicesCount,
      isActive: plan.isActive,
      price: plan.price,
      billingCycle: plan.billingCycle,
    };
  }
}
