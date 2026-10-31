require "json"

module BudgetDocumentFilters
  def usd_cents(value)
    cents = Integer(value)
    whole = (cents / 100).to_s.reverse.scan(/\d{1,3}/).join(",").reverse
    fraction = cents % 100
    "$#{whole}#{fraction.zero? ? '' : format('.%02d', fraction)}"
  end
end
Liquid::Template.register_filter(BudgetDocumentFilters)

Jekyll::Hooks.register :site, :pre_render do |site|
  # Retain the earlier federal reference data.
  site.data["sample_budget_request"] = JSON.parse(File.read(File.join(site.source, "budgets/fy2027-28/bridge-request.json")))
  site.data["sample_budget_justification"] = File.read(File.join(site.source, "budgets/fy2027-28/bridge-request.md"))
  c = site.data["city_case"]
  json_path = File.file?(File.join(site.source, c["document_json"])) ? c["document_json"] : c["preview_json"]
  md_path = File.file?(File.join(site.source, c["document_md"])) ? c["document_md"] : c["preview_md"]
  site.data["city_request"] = JSON.parse(File.read(File.join(site.source, json_path)))
  site.data["city_justification"] = File.read(File.join(site.source, md_path))
  site.data["city_request_json_path"] = json_path
  site.data["city_request_md_path"] = md_path
end
