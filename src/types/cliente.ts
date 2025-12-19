export interface Cliente {
  id: string
  empresaId: string
  codigo?: string | null
  rfc: string
  razonSocial: string
  nombreComercial?: string | null
  regimenFiscal?: string | null
  usoCfdi?: string | null
  
  // Dirección
  calle?: string | null
  numExterior?: string | null
  numInterior?: string | null
  colonia?: string | null
  codigoPostal?: string | null
  municipio?: string | null
  estado?: string | null
  pais?: string | null
  
  // Contacto
  email?: string | null
  telefono?: string | null
  contacto?: string | null
  
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateClienteInput extends Omit<Cliente, 'id' | 'createdAt' | 'updatedAt' | 'activo'> {
  // empresaId es requerido al crear
}

export interface UpdateClienteInput extends Partial<CreateClienteInput> {}
