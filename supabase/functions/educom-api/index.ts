import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EduOrgData {
  eo_id: string
  name_full: string
  name_short: string
  status_id: number
  status_name: string
  arhiv: number
  district: string
  type: string
  phone?: string
  email?: string
  website?: string
  parent_org?: string
  education_activity: boolean
}

interface ReorganizationData {
  event_type_name: string
  event_comments?: string
  ekis_in?: string
  ekis_out?: string
  event_date?: string
}

interface AddressData {
  address_type: string
  full_address: string
  postal_code?: string
  region?: string
  city?: string
  street?: string
  building?: string
  is_main_building: boolean
  adr_lat?: number
  adr_lng?: number
  district?: string
  metro_station?: string
}

const EDUCOM_API_BASE = 'https://api-st.educom.ru'

class EducomApiService {
  private supabase: any
  private token: string | null = null
  private tokenExpires: Date | null = null

  constructor(supabase: any) {
    this.supabase = supabase
  }

  private async logAction(action: string, endpoint: string, requestData?: any, responseData?: any, statusCode?: number, error?: string, executionTime?: number) {
    try {
      await this.supabase
        .from('api_logs')
        .insert({
          action_type: action,
          endpoint,
          request_data: requestData || null,
          response_data: responseData || null,
          status_code: statusCode || null,
          error_message: error || null,
          execution_time_ms: executionTime || null
        })
    } catch (logError) {
      console.error('Failed to log action:', logError)
    }
  }

  private async getValidToken(): Promise<string> {
    const startTime = Date.now()
    
    try {
      // Проверяем существующий токен в базе
      const { data: sessionData } = await this.supabase
        .from('api_sessions')
        .select('*')
        .eq('service_name', 'educom')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sessionData?.token) {
        this.token = sessionData.token
        this.tokenExpires = new Date(sessionData.expires_at)
        console.log('Using existing valid token')
        return this.token
      }
    } catch (error) {
      console.log('No valid token found, creating new session')
    }

    // Создаем новую сессию
    const login = Deno.env.get('EDUCOM_API_LOGIN')
    const password = Deno.env.get('EDUCOM_API_PASSWORD')

    if (!login || !password) {
      throw new Error('API credentials not configured')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      console.log('Attempting to create session with EKIS API...')
      const response = await fetch(`${EDUCOM_API_BASE}/v1/auth/createSession`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${login}:${password}`),
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      if (!response.ok) {
        const error = `Authorization failed: ${response.status} ${response.statusText}`
        console.error('EKIS API auth error:', error)
        await this.logAction('createSession', '/v1/auth/createSession', { login }, null, response.status, error, executionTime)
        throw new Error(error)
      }

      const data = await response.json()
      
      if (!data.data?.token) {
        const error = 'No token received from EKIS API'
        console.error('EKIS API response error:', error, data)
        await this.logAction('createSession', '/v1/auth/createSession', { login }, data, 200, error, executionTime)
        throw new Error(error)
      }

      this.token = data.data.token
      
      // Токен действует 3600 секунд
      this.tokenExpires = new Date(Date.now() + 3600 * 1000)

      // Сохраняем токен в базе
      await this.supabase
        .from('api_sessions')
        .insert({
          service_name: 'educom',
          token: this.token,
          expires_at: this.tokenExpires.toISOString()
        })

      await this.logAction('createSession', '/v1/auth/createSession', { login }, { token_created: true }, response.status, null, executionTime)
      console.log('New token created and saved')
      
      return this.token

    } catch (error) {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime
      const errorMessage = error.name === 'AbortError' ? 'Request timeout (10s exceeded)' : error.message
      console.error('Ошибка при создании сессии:', error)
      await this.logAction('createSession', '/v1/auth/createSession', { login }, null, null, errorMessage, executionTime)
      
      // Если это ошибка сети или таймаут, выбрасываем специальную ошибку
      if (error.name === 'AbortError' || error.message.includes('Load failed') || error.message.includes('NetworkError')) {
        throw new Error('EKIS API недоступен. Проверьте подключение к интернету или попробуйте позже.')
      }
      
      throw error
    }
  }

  async fetchEduOrgs(): Promise<EduOrgData[]> {
    const startTime = Date.now()
    const token = await this.getValidToken()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(`${EDUCOM_API_BASE}/functions/`, {
        method: 'POST',
        headers: {
          'X-API-TOKEN': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'v1.eduorg.getActual'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      if (!response.ok) {
        const error = `Failed to fetch organizations: ${response.status}`
        await this.logAction('fetchEduOrgs', '/functions/', { method: 'v1.eduorg.getActual' }, null, response.status, error, executionTime)
        throw new Error(error)
      }

      const data = await response.json()
      await this.logAction('fetchEduOrgs', '/functions/', { method: 'v1.eduorg.getActual' }, { count: data.data?.eduorgs?.length || 0 }, response.status, null, executionTime)
      
      return data.data?.eduorgs || []

    } catch (error) {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime
      await this.logAction('fetchEduOrgs', '/functions/', { method: 'v1.eduorg.getActual' }, null, null, error.message, executionTime)
      throw error
    }
  }

  async fetchEduOrgAddresses(eoId: string): Promise<AddressData[]> {
    const startTime = Date.now()
    const token = await this.getValidToken()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(`${EDUCOM_API_BASE}/functions/`, {
        method: 'POST',
        headers: {
          'X-API-TOKEN': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: `v1.eduorg.${eoId}.address`
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      if (!response.ok) {
        const error = `Failed to fetch addresses for ${eoId}: ${response.status}`
        await this.logAction('fetchEduOrgAddresses', '/functions/', { method: `v1.eduorg.${eoId}.address` }, null, response.status, error, executionTime)
        throw new Error(error)
      }

      const data = await response.json()
      await this.logAction('fetchEduOrgAddresses', '/functions/', { method: `v1.eduorg.${eoId}.address` }, { count: data.data?.addresses?.length || 0 }, response.status, null, executionTime)
      
      return data.data?.addresses || []

    } catch (error) {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime
      await this.logAction('fetchEduOrgAddresses', '/functions/', { method: `v1.eduorg.${eoId}.address` }, null, null, error.message, executionTime)
      throw error
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { action, filters } = body
    const apiService = new EducomApiService(supabase)

    switch (action) {
      case 'syncOrganizations': {
        console.log('Starting organization sync...')
        
        try {
          // Получаем данные организаций
          const eduOrgs = await apiService.fetchEduOrgs()
          console.log(`Fetched ${eduOrgs.length} organizations from API`)
        } catch (apiError) {
          console.error('Failed to fetch from EKIS API:', apiError.message)
          
          // Возвращаем ошибку с понятным сообщением
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Не удалось подключиться к API ЕКИС',
              details: apiError.message,
              suggestion: 'Проверьте подключение к интернету и повторите попытку'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 503 // Service Unavailable
            }
          )
        }
        
        const eduOrgs = await apiService.fetchEduOrgs()
        console.log(`Fetched ${eduOrgs.length} organizations from API`)

        let syncedCount = 0
        let errorCount = 0

        for (const org of eduOrgs) {
          try {
            // Определяем статус
            const statusName = org.status_id === 1 ? 'Действует' : 
                             org.status_id === 2 ? 'В стадии открытия (приказ)' : 
                             org.status_id === 3 ? 'В стадии закрытия (приказ)' : 'Неизвестно'

            // Получаем регион "Москва" из базы
            const { data: moscowRegion } = await supabase
              .from('regions')
              .select('id')
              .eq('name', 'Москва')
              .maybeSingle()
            
            // Уpsert организации
            const { error: upsertError } = await supabase
              .from('organizations')
              .upsert({
                ekis_id: org.eo_id,
                name: org.name_short || org.name_full,
                full_name: org.name_full,
                short_name: org.name_short,
                status_id: org.status_id,
                status_name: statusName,
                is_archived: org.arhiv === 1,
                has_education_activity: org.education_activity,
                district: org.district,
                type: org.type,
                phone: org.phone,
                email: org.email,
                website: org.website,
                parent_organization: org.parent_org,
                region_id: moscowRegion?.id || null,
                last_sync_at: new Date().toISOString(),
                is_manual: false
              }, {
                onConflict: 'ekis_id',
                ignoreDuplicates: false
              })

            if (upsertError) {
              console.error(`Error upserting organization ${org.eo_id}:`, upsertError)
              errorCount++
            } else {
              syncedCount++

              // Получаем ID организации для связи с адресами
              const { data: orgData, error: selectError } = await supabase
                .from('organizations')
                .select('id')
                .eq('ekis_id', org.eo_id)
                .maybeSingle()

              if (orgData && !selectError) {
                // Получаем адреса для организации
                try {
                  const addresses = await apiService.fetchEduOrgAddresses(org.eo_id)
                  
                  // Удаляем старые адреса
                  await supabase
                    .from('organization_addresses')
                    .delete()
                    .eq('organization_id', orgData.id)

                  // Добавляем новые адреса
                  if (addresses.length > 0) {
                    const addressInserts = addresses.map(address => ({
                      organization_id: orgData.id,
                      address_type: address.address_type || 'main',
                      full_address: address.full_address,
                      postal_code: address.postal_code,
                      region: address.region,
                      city: address.city,
                      street: address.street,
                      building: address.building,
                      is_main_building: address.is_main_building,
                      coordinates_lat: address.adr_lat,
                      coordinates_lng: address.adr_lng,
                      district: address.district,
                      metro_station: address.metro_station
                    }))

                    await supabase
                      .from('organization_addresses')
                      .insert(addressInserts)
                  }
                } catch (addressError) {
                  console.error(`Error fetching addresses for ${org.eo_id}:`, addressError)
                }
              }
            }
          } catch (error) {
            console.error(`Error processing organization ${org.eo_id}:`, error)
            errorCount++
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            synced: syncedCount,
            errors: errorCount,
            total: eduOrgs.length
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      case 'getOrganizations': {
        const query = supabase
          .from('organizations')
          .select(`
            *,
            organization_addresses(*),
            organization_reorganizations(*)
          `)
          .order('name')

        if (filters?.status_id) {
          query.eq('status_id', filters.status_id)
        }

        if (filters?.is_archived !== undefined) {
          query.eq('is_archived', filters.is_archived)
        }

        if (filters?.district) {
          query.eq('district', filters.district)
        }

        if (filters?.has_education_activity !== undefined) {
          query.eq('has_education_activity', filters.has_education_activity)
        }

        if (filters?.search) {
          query.or(`name.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,ekis_id.ilike.%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        return new Response(
          JSON.stringify({ data }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Произошла внутренняя ошибка',
        code: 'INTERNAL_ERROR'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})