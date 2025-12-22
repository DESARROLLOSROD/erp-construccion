export interface Categoria {
  id: string
  empresaId: string
  nombre: string
  descripcion?: string | null
  color?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCategoriaInput {
  nombre: string
  descripcion?: string
  color?: string
}

export interface UpdateCategoriaInput extends Partial<CreateCategoriaInput> {}
