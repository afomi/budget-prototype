# Adapted from afomi/jekyll-with-tailwind: compile CSS after Jekyll writes the site.
require "fileutils"

Jekyll::Hooks.register :site, :post_write do |site|
  cli = File.join(site.source, "node_modules", ".bin", "tailwindcss")
  input = File.join(site.source, "assets", "css", "tailwind.css")
  output = File.join(site.dest, "assets", "css", "main.css")

  unless File.executable?(cli)
    raise Jekyll::Errors::FatalException, "Tailwind is missing. Run npm ci before building Jekyll."
  end

  FileUtils.mkdir_p(File.dirname(output))
  Jekyll.logger.info "Tailwind:", "Compiling assets/css/main.css"
  unless system(cli, "-i", input, "-o", output, "--minify", chdir: site.source)
    raise Jekyll::Errors::FatalException, "Tailwind CSS compilation failed."
  end
end
