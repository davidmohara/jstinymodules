(function ($) {
	var partial = new base2.Package(this, {
		name: "core",
		version: "1.0",
		parent: improving,
		imports: "improving"
	});

	eval(this.imports);

	var PartialModule = Module.extend({
		load: function () {
			$("#status").append("<p>I was loaded from the partial.js file</p>");
			}
	});

	eval(this.exports);

})(jQuery);	
