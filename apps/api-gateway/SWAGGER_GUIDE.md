# Swagger API Documentation Guide

## Overview
Swagger documentation has been successfully added to the API Gateway. This provides an interactive interface to explore and test all available APIs.

## Accessing Swagger UI

Once the API Gateway is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

*(Replace `3000` with your configured port if different)*

## Features

### 1. **Interactive API Testing**
- Test all endpoints directly from the browser
- View request/response schemas
- See example values for all fields

### 2. **Authentication**
- Click the **"Authorize"** button at the top right
- Enter your JWT token in the format: `Bearer your_token_here` (or just `your_token_here`)
- All subsequent requests will include the authentication token

### 3. **API Categories**
The documentation is organized by tags:
- **health** - Health check endpoints
- **users** - User management endpoints
- **classes** - Class management endpoints
- **exams** - Exam management endpoints
- **meetings** - Meeting management endpoints
- **chats** - Chat management endpoints
- **products** - Product management endpoints

### 4. **Request/Response Examples**
Each endpoint shows:
- Required and optional parameters
- Request body schema with examples
- Possible response codes
- Response data structure

## Configuration

### Swagger Setup (main.ts)
The Swagger configuration is in `apps/api-gateway/src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('API Gateway Documentation')
  .setDescription('The API Gateway for microservices architecture')
  .setVersion('1.0')
  .addBearerAuth(...)
  .build();
```

### Adding Swagger to New Controllers

1. **Import Swagger decorators:**
```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
```

2. **Add decorators to controller class:**
```typescript
@ApiTags('your-resource')
@ApiBearerAuth('JWT-auth')
@Controller('your-resource')
export class YourController { ... }
```

3. **Document each endpoint:**
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get item by ID', description: 'Detailed description' })
@ApiParam({ name: 'id', type: Number, description: 'Item ID' })
@ApiResponse({ status: 200, description: 'Item retrieved successfully' })
@ApiResponse({ status: 404, description: 'Item not found' })
async findOne(@Param('id') id: number) { ... }
```

### Adding Swagger to DTOs

Add `@ApiProperty()` decorators to DTO fields:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'Sample Item' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Item description', example: 'A sample description' })
  @IsOptional()
  @IsString()
  description?: string;
}
```

## Best Practices

1. **Use descriptive summaries** - Keep them short and clear
2. **Add detailed descriptions** - Explain what each endpoint does
3. **Document all response codes** - Include success and error scenarios
4. **Provide examples** - Help developers understand expected data formats
5. **Group related endpoints** - Use appropriate tags
6. **Document authentication requirements** - Use `@ApiBearerAuth()` for protected routes

## Customization

### Change Swagger Path
In `main.ts`, modify the path:
```typescript
SwaggerModule.setup('api-docs', app, document);
// Change 'api-docs' to your preferred path
```

### Add More Tags
In `main.ts`, add more tags:
```typescript
.addTag('new-resource', 'Description of new resource')
```

### Customize Theme
Pass additional options to `SwaggerModule.setup()`:
```typescript
SwaggerModule.setup('api-docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true, // Keep auth token across page refreshes
    docExpansion: 'none', // 'list' | 'full' | 'none'
    filter: true, // Enable filtering by tags
  },
});
```

## Troubleshooting

### Swagger page not loading
- Check if the server is running
- Verify the port number
- Clear browser cache

### Endpoints not showing up
- Make sure controllers are properly imported in modules
- Check if `@Controller()` decorator is present
- Verify Swagger decorators are correctly applied

### Authentication not working
- Ensure JWT token format is correct
- Check if `@ApiBearerAuth('JWT-auth')` is added to protected controllers
- Verify the authorization guard is working

## Additional Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
