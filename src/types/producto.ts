export interface Producto {
  id: string
  empresaId: string
  codigo: string
  descripcion: string
  categoriaId?: string | null
  unidadId?: string | null

  // SAT
  claveSat?: string | null
  claveUnidadSat?: string | null

  // Precios
  precioCompra: number
  precioVenta: number

  // Control
  esServicio: boolean
  controlStock: boolean
  stockMinimo: number
  stockActual: number

  activo: boolean
  createdAt: Date
  updatedAt: Date

  // Relaciones opcionales
  categoria?: {
    id: string
    nombre: string
    color?: string | null
  } | null
  unidad?: {
    id: string
    nombre: string
    abreviatura: string
  } | null
}

export interface CreateProductoInput {
  codigo: string
  descripcion: string
  categoriaId?: string
  unidadId?: string
  claveSat?: string
  claveUnidadSat?: string
  precioCompra?: number
  precioVenta?: number
  esServicio?: boolean
  controlStock?: boolean
  stockMinimo?: number
  stockActual?: number
}

export interface UpdateProductoInput extends Partial<CreateProductoInput> {}

export interface ProductoListItem extends Omit<Producto, 'categoria' | 'unidad'> {
  categoria?: {
    id: string
    nombre: string
    color?: string | null
  } | null
  unidad?: {
    id: string
    nombre: string
    abreviatura: string
  } | null
}
