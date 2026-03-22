#!/usr/bin/env ruby
# frozen_string_literal: true

#
# NASA Space Explorer — MCP Server (Ruby)
#
# Tools:
#   1. get_astronomy_picture  – Astronomy Picture of the Day
#   2. get_asteroids           – Near-Earth asteroids in a date range
#
# Uses NASA's free DEMO_KEY by default.
# Set the NASA_API_KEY env var for higher rate limits.
#

require 'json'
require 'mcp'
require 'net/http'
require 'uri'
require 'time'
require_relative 'tools/get_astronomy_picture'
require_relative 'tools/get_asteroids'
require_relative 'nasa_api'

server = MCP::Server.new(
  name: 'nasa-space-explorer',
  tools: [GetAstronomyPicture, GetAsteroids]
)

transport = MCP::Server::Transports::StdioTransport.new(server)
transport.open
