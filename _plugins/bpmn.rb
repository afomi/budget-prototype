# Register dependency assets with Jekyll so clean/watch rebuilds retain them.
class BudgetBpmnAsset < Jekyll::StaticFile
  def initialize(site, base, source_path, target_path)
    super(site, base, File.dirname(source_path), File.basename(source_path))
    @target_path = target_path
  end

  def destination(dest)
    File.join(dest, @target_path)
  end
end

class BudgetBpmnAssets < Jekyll::Generator
  safe true
  priority :low

  def generate(site)
    base = File.join(site.source, "node_modules/bpmn-js")
    viewer = "dist/bpmn-navigated-viewer.production.min.js"
    unless File.file?(File.join(base, viewer))
      raise Jekyll::Errors::FatalException, "BPMN viewer missing. Run npm ci."
    end

    files = [viewer, "LICENSE"] + Dir.glob(File.join(base, "dist/assets/**/*"))
      .select { |path| File.file?(path) }
      .map { |path| path.delete_prefix("#{base}/") }
    files.each do |source_path|
      target = File.join("assets/bpmn-js", source_path.delete_prefix("dist/"))
      site.static_files << BudgetBpmnAsset.new(site, base, source_path, target)
    end
  end
end

Jekyll::Hooks.register :site, :pre_render do |site|
  site.data["budget_bpmn_xml"] = File.read(File.join(site.source, "diagrams/budget-lifecycle.bpmn"))
  site.data["city_bpmn_xml"] = File.read(File.join(site.source, "diagrams/city-maintenance.bpmn"))
end
