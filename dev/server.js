const express=require('express');
const app=express();

const bodyParser=require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

const uuid=require('uuid/v1');

const DBOperations=require('./db');
const dbop=new DBOperations();

const Model=require('./models/Model');

app.use(express.static(__dirname+'/public'));

app.get('/',function(req,res){
    res.sendFile("./public/register.html",{root:__dirname});
});

app.get('/register',function(req,res){
    res.sendFile("./public/register.html",{root:__dirname});
});

app.get('/login',function(req,res){
    res.sendFile("./public/login.html",{root:__dirname});
});

app.post('/login',function(req,res){
    const username=req.body.username;
    const password=req.body.password;

    dbop.login(username,password,function(data){
        if(data.code==200){
            res.send(data);
        }else{
            res.send(data);
        }
    });
});

app.get('/dashboard',function(req,res){
    res.sendFile("./public/dashboard.html",{root:__dirname});
});

app.get('/user/:rfidCardNumber',function(req,res){
    console.log(req.params.rfidCardNumber);
    dbop.getUser(req.params.rfidCardNumber,function(result){
        res.send(result);
    })
});

app.get('/users',function(req,res){
    dbop.getAllUsers(function(rows){
        res.json(rows);
    });
});

app.post('/createUser',function(req,res){
    const rfidCardNumber=req.body.rfidCardNumber;
    const name=req.body.name;
    const username=req.body.username;
    const password=req.body.password;
    const dob=req.body.dob;
    const gender=req.body.gender;
    const drivingLicenseNumber=req.body.drivingLicenseNumber;
    const mobileNumber=req.body.mobileNumber;
    const emailAddress=req.body.emailAddress;

    const user=new Model.User(rfidCardNumber,name,username,password,dob,gender,drivingLicenseNumber,mobileNumber,emailAddress);
    
    console.log(user);

    dbop.addUser(user,function(data){
        res.send(data);
    });
    
});

app.post('/addMoney',function(req,res){
    const rfidCardNumber=req.body.rfidCardNumber;
    const amount=req.body.amount;

    const transactionToSelf=new Model.TransactionToSelf(amount);

    dbop.addMoney(rfidCardNumber,transactionToSelf,function(data){
        res.send(data);
    });
});

app.post('/swipe',function(req,res){
    const rfidCardNumber=req.body.rfidCardNumber;
    const amount=req.body.amount;
    const tollBoothID=req.body.tollBoothID;
    const transaction=new Model.Transaction(amount,tollBoothID);

    dbop.swipeToPayToll(rfidCardNumber,transaction,function(data){
        res.send(data);
    });
});

app.post('/addTollBooth',function(req,res){
    const name=req.body.name;
    const address=req.body.address;

    const tollBooth=new Model.TollBooth(name,address);

    dbop.addToll(tollBooth,function(data){
        res.send(data);
    });
});

// app.post('./findToll/:tollBoothID',function(data){

// })


app.listen(3000,function(){
    console.log("App is listening on port 3000");
});