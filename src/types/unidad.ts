export interface Unidad {
  id: string
  empresaId: string
  nombre: string
  abreviatura: string
  claveSat?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUnidadInput {
  nombre: string
  abreviatura: string
  claveSat?: string
}

export interface UpdateUnidadInput extends Partial<CreateUnidadInput> {}
