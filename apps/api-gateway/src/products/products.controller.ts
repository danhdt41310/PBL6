import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Inject, HttpStatus, HttpException, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject('PRODUCTS_SERVICE') private readonly productsClient: ClientProxy,
  ) {}

  @Post()
  async create(@Body(ValidationPipe) createProductDto: CreateProductDto) {
    try {
      return await this.productsClient
        .send('create_product', createProductDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Products service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to create product', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      throw new HttpException('Failed to create product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(@Query('category') category?: string) {
    try {
      if (category) {
        return await this.productsClient
          .send('get_products_by_category', { category })
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(new HttpException('Failed to fetch products', HttpStatus.SERVICE_UNAVAILABLE));
            }),
          )
          .toPromise();
      }

      return await this.productsClient
        .send('get_all_products', {})
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Failed to fetch products', HttpStatus.SERVICE_UNAVAILABLE));
          }),
        )
        .toPromise();
    } catch (error) {
      throw new HttpException('Failed to fetch products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.productsClient
        .send('get_product_by_id', { id })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Product not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      throw new HttpException('Failed to fetch product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(ValidationPipe) updateProductDto: UpdateProductDto) {
    try {
      return await this.productsClient
        .send('update_product', { id, updateProductDto })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Failed to update product', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      throw new HttpException('Failed to update product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.productsClient
        .send('delete_product', { id })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Failed to delete product', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
      
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new HttpException('Failed to delete product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/stock')
  async updateStock(@Param('id') id: string, @Body() data: { quantity: number }) {
    try {
      return await this.productsClient
        .send('update_product_stock', { id, quantity: data.quantity })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Failed to update stock', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      throw new HttpException('Failed to update stock', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
