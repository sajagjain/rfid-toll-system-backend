$(document).ready(function(){
    $('#registerbtn').click(function(){   
        $.ajax({
            type: "POST",
            url: "https://rfid-project-sajagjain.herokuapp.com/createUser",
            data: {
                "rfidCardNumber":$('#rfid').val(),
                "name":$('#fullname').val(),
                "username":$('#username').val(),
                "password":$('#password').val(),
                "dob":$('#dob').val(),
                "gender":$('.gender:checked').val(),
                "drivingLicenseNumber":$('#dlnumber').val(),
                "emailAddress":$('#emailAddress').val(),
                "mobileNumber":$('#mobileNumber').val()
            },
            dataType:'json',
            success: function(result){
                console.log(result);
                if(result.code!==200){
                    $('#errorLabel').text(result.message);
                }else{
                    window.location.href="https://rfid-project-sajagjain.herokuapp.com/login";
                }
            }
        });
        $('#registerForm')[0].reset();
    });
    $('#loginbtn').click(function(){   
        $.ajax({
            type: "POST",
            url: "https://rfid-project-sajagjain.herokuapp.com/login",
            data: {
                "username":$('#lusername').val(),
                "password":$('#lpassword').val(),
            },
            dataType:'json',
            success: function(result){
                if(result.code==200){
                    console.log(result);
                    sessionStorage.setItem("data",JSON.stringify(result.data));
                    window.location.href = "https://rfid-project-sajagjain.herokuapp.com/dashboard";
                }else{
                    console.log(result);
                    $('#messageLabelLoginPage').text(result.message);
                }
            }
        });
        $('#loginForm')[0].reset();
    });
    
    
});