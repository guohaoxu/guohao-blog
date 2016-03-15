$(function () {
	$(window).scroll(function(){
		if($(window).scrollTop() > 500){
			$("#upTop").show();
		}else{
			$("#upTop").hide();
		}
	});

    $("#upTop").click(function () {
		$("html, body").animate({
			scrollTop: 0
		});
	});
});