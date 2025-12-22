export interface Proveedor {
  id: string
  empresaId: string
  codigo?: string | null
  rfc: string
  razonSocial: string
  nombreComercial?: string | null

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

  // Bancario
  banco?: string | null
  cuenta?: string | null
  clabe?: string | null

  activo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateProveedorInput {
  codigo?: string
  rfc: string
  razonSocial: string
  nombreComercial?: string
  calle?: string
  numExterior?: string
  numInterior?: string
  colonia?: string
  codigoPostal?: string
  municipio?: string
  estado?: string
  pais?: string
  email?: string
  telefono?: string
  contacto?: string
  banco?: string
  cuenta?: string
  clabe?: string
}

export interface UpdateProveedorInput extends Partial<CreateProveedorInput> {}
