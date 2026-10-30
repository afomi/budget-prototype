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
  request = JSON.parse(File.read(File.join(site.source, "budgets/fy2027-28/bridge-request.json")))
  site.data["sample_budget_request"] = request
  site.data["sample_budget_justification"] = File.read(File.join(site.source, "budgets/fy2027-28/bridge-request.md"))

  # Use the same line-item text in the page and illustrative PR review.
  review = site.data["lifecycle"]["activities"].find { |item| item["id"] == "omb-review" }["artifact"]["review"]
  item = request["line_items"].find { |line| line["id"] == review["item_id"] }
  review["new_justification"] = item["justification"] if item
end
