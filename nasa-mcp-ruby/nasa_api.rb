module NasaApi
  API_KEY = ENV.fetch('NASA_API_KEY', 'DEMO_KEY')
  API_BASE_URL = 'https://api.nasa.gov'

  module_function

  def fetch(path:, base_url: API_BASE_URL, params: {})
    params['api_key'] = API_KEY
    uri = URI("#{base_url}#{path}")
    uri.query = URI.encode_www_form(params)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 10
    http.read_timeout = 30

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'nasa-mcp-server/1.0'

    response = http.request(request)

    raise "NASA API #{response.code}: #{response.body[0, 500]}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end

  def today
    Time.now.utc.strftime('%Y-%m-%d')
  end
end
