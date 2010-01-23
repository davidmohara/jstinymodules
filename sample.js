(function ($) {
	var core = new base2.Package(this, {
		name: "core",
		version: "1.0",
		parent: improving,
		imports: "improving",
		exports: "service"
	});

	eval(this.imports);

	var CoreModule = Module.extend({
		load: function () {
			$('.clicky').live("click", function(){
				$('#content').load($(this).attr('href'));
				});
			}
	});

	var service = {
	
	};
	
	eval(this.exports);

})(jQuery);	
