class GetAsteroids < MCP::Tool
  description 'Search for near-Earth asteroids (NEOs) within a date range ' \
              '(max 7 days). Returns name, size, hazard status, miss distance, ' \
              'and velocity for each asteroid.'

  input_schema(
    properties: {
      start_date: {
        type: 'string',
        description: 'Start date YYYY-MM-DD (defaults to today)'
      },
      end_date: {
        type: 'string',
        description: 'End date YYYY-MM-DD (defaults to start_date + 1 day)'
      }
    }
  )

  class << self
    def commify(n)
      n.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
    end

    def call(server_context:, **args)
      start = args[:start_date] || NasaApi.today
      params = { 'start_date' => start }
      params['end_date'] = args[:end_date] if args[:end_date]

      data = NasaApi.fetch(path: '/neo/rest/v1/feed', params:)

      lines = ["Found #{data['element_count']} near-Earth asteroid(s):\n"]

      data['near_earth_objects'].each do |_date, asteroids|
        asteroids.each do |a|
          diam = a['estimated_diameter']['meters']
          approach = a.dig('close_approach_data', 0)
          hazard = a['is_potentially_hazardous_asteroid'] ? '⚠️ YES' : 'No'

          lines << "• #{a['name']}"
          lines << "  Diameter: #{diam['estimated_diameter_min'].round}–#{diam['estimated_diameter_max'].round} m"
          lines << "  Potentially hazardous: #{hazard}"

          if approach
            miss_km = commify(approach.dig('miss_distance', 'kilometers').to_f.round)
            vel_kmh = commify(approach.dig('relative_velocity', 'kilometers_per_hour').to_f.round)

            lines << "  Closest approach: #{approach['close_approach_date']} | " \
                     "Miss distance: #{miss_km} km | Velocity: #{vel_kmh} km/h"
          end

          lines << ''
        end
      end

      MCP::Tool::Response.new([{ type: 'text', text: lines.join("\n") }])
    end
  end
end
