export interface MasterRecord {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
  native_name?: string | null;
  country_id?: number | null;
  organization_id?: number | null;
  parent_unit_id?: number | null;
  created_at?: string | null;
}

export interface MasterDataListResponse {
  languages: MasterRecord[];
  states: MasterRecord[];
  occupations: MasterRecord[];
  organizations: MasterRecord[];
  organization_units: MasterRecord[];
}
