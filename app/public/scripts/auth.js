$(function(){
	if (window.navigator.standalone) {
      $("meta[name='apple-mobile-web-app-status-bar-style']").remove();
    }

	//login modal shows up
	$('#login-button').click(function(){

		$("#auth-modal #social-box .title > span").text("Log In");
		$("#auth-modal #local-box form").attr('action','/login');
		$('#auth-modal').modal();

	});
	
	//signup modal shows up
	$('#signup-button').click(function(){

		$("#auth-modal #social-box .title > span").text("Sign Up");
		$("#auth-modal #local-box form").attr('action','/signup');
		$('#auth-modal').modal();

	});

	$('#photos-modal li').on('click','button',function(){

		var id = $(this).attr('id');
		console.log(id);
		var button = "<button class='btn btn-default'> Make this as default photo.</button>";
		var div = "<div class='label label-info'>Default Photo </div>";
		$('#photos-modal .label-info, #photos-modal .btn-default:not(.close)').remove();
		
		if(id==='facebook-defaultPhoto'){

			$.post('/defaultPhoto/facebook',function(data){
				
				$("#facebook-photo").append(div);
				$("#photos-modal li:not(.last,#facebook-photo)").append(button);
				$('#twitter-photo .btn-default').attr('id','twitter-defaultPhoto');
				$('#google-photo .btn-default').attr('id','google-defaultPhoto');
				$('#local-photo .btn-default').attr('id','local-defaultPhoto');
				$("header .profilePhoto").attr('src',data);
			});

		}else if(id ==="twitter-defaultPhoto"){

			$.post('/defaultPhoto/twitter',function(data){
				
				$("#twitter-photo").append(div);
				$("#photos-modal li:not(.last,#twitter-photo)").append(button);
				$('#facebook-photo .btn-default').attr('id','facebook-defaultPhoto');
				$('#google-photo .btn-default').attr('id','google-defaultPhoto');
				$('#local-photo .btn-default').attr('id','local-defaultPhoto');
				$("header .profilePhoto").attr('src',data);
			});

		}else if(id ==="google-defaultPhoto"){

			$.post('/defaultPhoto/google',function(data){
				
				$("#google-photo").append(div);
				$("#photos-modal li:not(.last,#google-photo)").append(button);
				$('#twitter-photo .btn-default').attr('id','twitter-defaultPhoto');
				$('#facebook-photo .btn-default').attr('id','facebook-defaultPhoto');
				$('#local-photo .btn-default').attr('id','local-defaultPhoto');
				$("header .profilePhoto").attr('src',data);

			});

		}else{

			$.post('/defaultPhoto/local',function(data){
				$("#local-photo").append(div);
				$("#photos-modal li:not(s.last,#local-photo)").append(button);
				$('#twitter-photo .btn-default').attr('id','twitter-defaultPhoto');
				$('#facebook-photo .btn-default').attr('id','facebook-defaultPhoto');
				$('#google-photo .btn-default').attr('id','google-defaultPhoto');
				$("header .profilePhoto").attr('src',data);
			});

		}



	});

	$('#uploader').change(function(){
		

		$('#upload-form').submit();
		
		
	});

	$('#changePhoto').change(function(){
		

		$('#changePhoto-form').submit();
		
		
	});
	
	
	//shows the submit button for reset password when the conditions are met
	var showsSubmitButton = function(hasCorrectPass,hasConfirmedPass){
		//check if the user inputs the right old password
		//and if the user inputs the same new passwords.
		if(hasCorrectPass && hasConfirmedPass){
		
			$("#reset-password-modal input[type='submit']").addClass("btn-primary").prop('disabled',false);
		
		}else if($("#reset-password-modal input[type='submit']").hasClass('btn-primary')){
			
			$("#reset-password-modal input[type='submit']").removeClass("btn-primary").prop('disabled',true);
		
		}else{
			$("#reset-password-modal input[type='submit']").prop('disabled',true);
		
		}
	}

	var hasCorrectPass,hasConfirmedPass = false;
	$("#oldPass").focusout(function(event) {
	
		var params = { oldPass:$(this).val()};

		$.get( '/checkPass',params, function(data) {
    		
    		if(data){
    			
    			$("#pass-label").hide();
    			hasCorrectPass = true;
    			showsSubmitButton(hasCorrectPass,hasConfirmedPass);

    		}else{
    			
    			$("#pass-label").show();
    			hasCorrectPass = false;
    			showsSubmitButton(hasCorrectPass,hasConfirmedPass);

    		}
    	});
	});

	$("#newPass").focusout(function(event){
		if($("#newPass").val().length<4){
			$("#empty-label").show();
			$("#confirm-label").hide();
			hasConfirmedPass = false;
			showsSubmitButton(hasCorrectPass,hasConfirmedPass);

		}else if($("#newPass").val()===$("#confirmPass").val()){
	    	$("#empty-label").hide();
			$("#confirm-label").hide();
			hasConfirmedPass = true;
			showsSubmitButton(hasCorrectPass,hasConfirmedPass);
		
		}else{
			$("#empty-label").hide();
			hasConfirmedPass = false;
			showsSubmitButton(hasCorrectPass,hasConfirmedPass);

		}
	});

	$("#confirmPass").keyup(function(event){

		if($("#newPass").val()!==''&& $("#newPass").val()===$("#confirmPass").val()){
	    	$("#empty-label").hide();
			$("#confirm-label").hide();
			hasConfirmedPass = true;
			showsSubmitButton(hasCorrectPass,hasConfirmedPass);
		
		}else{
			$("#empty-label").hide();
			$("#confirm-label").show();
			hasConfirmedPass = false;
			showsSubmitButton(hasCorrectPass,hasConfirmedPass);

		}
	});
	

	$("#publish-modal .social-accounts li,#publish-modal .social-accounts a").on('click',function(){
		var id = $(this).attr('id');
		var link = $('#link').text();
		var wallpost = {
			message : "Would you like to join my chatroom? ",
			url 	: link
		}

		console.log(link);

		if(id==="facebook-post"){

			$(this).text("Message sent");

			setTimeout(function(){$("#facebook-post").text('Send to Facebook Again')},1500);
			
			$.get('/post/facebook',wallpost,function(data){	
				console.log(data);
			});

		}else if(id==="twitter-post"){
			$(this).text("Message sent");
			
			setTimeout(function(){$("#twitter-post").text('Send to Twitter Again')},1500);

			$.get('/post/twitter',wallpost,function(data){	
				console.log(data);
			});

		}else if(id==="google-post"){
			
			$(this).text("Message shared");
			setTimeout(function(){$("#google-post").text('Send to Google Again')},1500);
			
			window.open("https://plus.google.com/share?url='"+link+"'", '', 'menubar=no,toolbar=no,height=600,width=600');
			return false;

			
		}else if(id==="all-post"){
			
			$(".social-accounts li:not(#all-post), .social-accounts a").text("Message sent");
			setTimeout(function(){
				if($("#facebook-post")){
					$("#facebook-post").text('Send to Facebook Again');
				}
				if($("#twitter-post")){
					$("#twitter-post").text('Send to Twitter Again');
				}
				if($("#google-post")){
					$("#google-post").text('Share on Google + Again');
				}
				
			},1500);
			
			$.get('/post/all',wallpost,function(data){	
				console.log(data);
			});

			window.open("https://plus.google.com/share?url='"+link+"'", '', 'menubar=no,toolbar=no,height=600,width=600');
			
			return false;
			
		}
		
	});
	


});