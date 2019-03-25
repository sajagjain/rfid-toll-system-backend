const uuid=require('uuid/v1');

function User(
    rfidCardNumber,
    name,
    username,
    password,
    dob,
    gender,
    drivingLicenseNumber,
    mobileNumber,
    emailAddress
    ){
    this.rfidCardNumber=rfidCardNumber;
    this.name=name;
    this.username=username;
    this.password=password;
    this.dob=dob;
    this.gender=gender;
    this.drivingLicenseNumber=drivingLicenseNumber;
    this.wallet=new Wallet();
    this.mobileNumber=mobileNumber;
    this.emailAddress=emailAddress;
};

function Wallet(){
    this.walletBalance=0;
    this.transactions=[];
};

function Transaction(amount,tollBoothID){
    this.amount=amount;
    this.timeStamp=Date.now();
    this.transactionType=amount>0?"Credit":"Debit";
    this.tollBoothID=tollBoothID;
}

function TransactionToSelf(amount){
    this.amount=amount;
    this.timeStamp=Date.now();
    this.transactionType=amount>0?"Credit":"Debit";
}

function TollBooth(name,address){
    this.tollBoothID=uuid().split('-').join('');
    this.name=name;
    //this.username=username;
    //this.password=password;
    this.address=address;
    this.wallet=new Wallet();
}

module.exports={
    User:User,
    Wallet:Wallet,
    Transaction:Transaction,
    TransactionToSelf:TransactionToSelf,
    TollBooth:TollBooth
}