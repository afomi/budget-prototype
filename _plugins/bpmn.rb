require "fileutils"

Jekyll::Hooks.register :site, :pre_render do |site|
  site.data["budget_bpmn_xml"] = File.read(File.join(site.source, "diagrams/budget-lifecycle.bpmn"))
end

Jekyll::Hooks.register :site, :post_write do |site|
  source = File.join(site.source, "node_modules/bpmn-js/dist")
  destination = File.join(site.dest, "assets/vendor/bpmn-js")
  raise Jekyll::Errors::FatalException, "BPMN viewer missing. Run npm ci." unless File.directory?(source)
  FileUtils.mkdir_p(destination)
  FileUtils.cp(File.join(source, "bpmn-navigated-viewer.production.min.js"), destination)
  FileUtils.cp_r(File.join(source, "assets"), destination)
  FileUtils.cp(File.join(site.source, "node_modules/bpmn-js/LICENSE"), destination)
end
