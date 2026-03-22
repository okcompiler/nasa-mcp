class GetAstronomyPicture < MCP::Tool
  description "Get NASA's Astronomy Picture of the Day. Returns the title, " \
                'explanation, and image URL. Optionally pass a date (YYYY-MM-DD) ' \
                'to see a past picture.'

  input_schema(
    properties: {
      date: {
        type: 'string',
        description: 'Date in YYYY-MM-DD format (defaults to today)'
      }
    }
  )

  class << self
    def call(server_context:, **args)
      params = {}
      params['date'] = args[:date] if args[:date]

      data = NasaApi.fetch(path: '/planetary/apod', params:)

      lines = [
        "🌌 #{data['title']}",
        "Date: #{data['date']}",
        "Media type: #{data['media_type']}",
        ("Copyright: #{data['copyright']}" if data['copyright']),
        '',
        data['explanation'],
        '',
        "Image URL: #{data['url']}",
        ("HD Image URL: #{data['hdurl']}" if data['hdurl'])
      ].compact

      MCP::Tool::Response.new([{ type: 'text', text: lines.join("\n") }])
    end
  end
end
