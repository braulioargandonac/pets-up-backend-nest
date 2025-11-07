import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  Body,
  Patch,
} from '@nestjs/common';
import { VetsService } from './vets.service';
import { Role } from 'generated/prisma';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role as RoleEnum } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateVetDto } from './dto/create-vet.dto';
import { FindVetsQueryDto } from './dto/find-vets-query.dto';
import { UpdateVetDto } from './dto/update-vet.dto';

type AuthenticatedUser = { id: number; email: string; roles: Role[] };
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('vets')
export class VetsController {
  constructor(private readonly vetsService: VetsService) {}

  /**
   * Endpoint público para buscar veterinarias por proximidad y filtros.
   * GET /api/v1/vets?lat=...&lon=...&radiusKm=...
   */
  @Get()
  findAll(@Query() query: FindVetsQueryDto) {
    return this.vetsService.findNearby(query);
  }

  /**
   * Endpoint público para ver el detalle de UNA veterinaria.
   * GET /api/v1/vets/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vetsService.findOne(id);
  }

  /**
   * Endpoint protegido (VET_OWNER) para registrar una nueva veterinaria.
   * POST /api/v1/vets
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() createVetDto: CreateVetDto) {
    const userId = req.user.id;
    return this.vetsService.createVet(userId, createVetDto);
  }

  /**
   * Endpoint protegido (VET_OWNER) para actualizar el perfil de la veterinaria.
   * PATCH /api/v1/vets/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.VET_OWNER)
  @HttpCode(HttpStatus.OK)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) vetId: number,
    @Body() updateVetDto: UpdateVetDto,
  ) {
    const userId = req.user.id;
    return this.vetsService.updateVet(userId, vetId, updateVetDto);
  }
}
