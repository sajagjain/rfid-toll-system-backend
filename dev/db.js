const MongoClient=require('mongodb').MongoClient;
const url='mongodb://shivani:shivani123@ds123196.mlab.com:23196/rfid-db';
const client=new MongoClient(url,{useNewUrlParser:true});

class DBOperations{

    getCollectionUser(fn){ 

        client.connect(function(err,client){
            if(!err){
                console.log("Connected");
                
                const db=client.db('rfid-db');
                const collection=db.collection('users');
                
                fn(collection);
            }else{
                console.log("Connection Failed with error : "+err.message+err.errmsg);
                fn(null);
            }
        });
    }

    getCollectionTolls(fn){ 

        client.connect(function(err,client){
            if(!err){
                console.log("Connected");
                
                const db=client.db('rfid-db');
                const collection=db.collection('tolls');
                
                fn(collection);
            }else{
                console.log("Connection Failed with error : "+err.message);
                fn(null);
            }
        });
    }

    getAllUsers(fn){
        this.getCollectionUser(function(collection){

            if(collection!==null&&collection!==undefined){
                
                var cursor=collection.find({});
                
                cursor.toArray(function(err,docs){
                    if(!err){
                        fn({code:200,users:docs});
                    }else{
                        fn({code:404,users:[]});        
                    }
                });
                
            }else{
                fn({code:404,users:[]});
            }
        });
        
    }

    addUser(newUser,fn){
        this.getCollectionUser(function(collection){

            if(collection!==null&&collection!==undefined){
                
                //Refactoring Needed add conditions
                collection.findOne({rfidCardNumber:newUser.rfidCardNumber}).then(data1=>{
                    if(data1!==null&&data1.rfidCardNumber===newUser.rfidCardNumber){
                        console.log(data1);
                        fn({code:404,message:"RFID already exists."});
                    }
                });
                collection.findOne({username:newUser.username}).then(data2=>{
                    if(data2!==null&&data2.username===newUser.username){
                        fn({code:404,message:"Username already exists."});
                    }
                });
                collection.findOne({drivingLicenseNumber:newUser.drivingLicenseNumber}).then(data3=>{
                    if(data3!==null&&data3.drivingLicenseNumber===newUser.drivingLicenseNumber){
                        fn({code:404,message:"Driving License already exists."});
                    }
                });
                collection.insertOne(newUser,function(err,result){
                    //console.log(result);
                    if(!err){
                        fn({code:200,message:"User Created Successfully"});
                    }else{
                        fn({code:404,message:"Unable To Create User"});
                    }
                });                  
            }else{
                fn({code:404,message:"Error Reaching Database"});
            }
        });
    }

    addMoney(rfidCardNumber,transaction,fn){
        this.getCollectionUser(function(collection){
            if(collection!==null&&collection!==undefined)
            {

                collection.updateOne({rfidCardNumber:rfidCardNumber}
                    ,{
                        $inc:{"wallet.walletBalance":eval(transaction.amount)},
                        $push:{"wallet.transactions":transaction}
                    }
                    ,function(err,result){
                       if(!err){
                           fn({code:200,message:"Money added to your wallet Succesfully"})
                       }else{
                           fn({code:404,message:"Unable to add money to your wallet"+err.message}) 
                       }
                    });
            }else{
                fn({code:404,message:"Error Reaching Database"});
            }
        });
    }

    addToll(tollBooth,fn){
        this.getCollectionTolls(function(tolls){
            if(tolls!==null&&tolls!==undefined){
                tolls.insertOne(tollBooth,function(err,result){
                    if(!err){
                        fn({code:200,message:"Toll Inserted Successfully"});    
                    }else{
                        fn({code:404,message:"Error Adding Toll"+err.message});    
                    }
                });
            }else{
                fn({code:404,message:"Error Reaching Database"});
            }
        });
    }

    swipeToPayToll(rfidCardNumber,transaction,fn){
        var self=this;

        this.getCollectionUser(function(collection){
            if(collection!==null&&collection!==undefined)
            {
                self.getCollectionTolls(function(tolls){
                    tolls.findOne({tollBoothID:transaction.tollBoothID})
                    .then(data=>{
                        tolls.updateOne({tollBoothID:data.tollBoothID},
                        {
                            $inc:{"wallet.walletBalance":eval(transaction.amount)},
                            $push:{"wallet.transactions":transaction}    
                        },
                        function(err,result){
                            if(err){
                                fn({code:404,message:"Unable to pay for toll"+err.message}) 
                            }
                        });
                    });
                });

                transaction.transactionType="Debit";
                collection.updateOne({rfidCardNumber:rfidCardNumber},
                    {
                        $inc:{"wallet.walletBalance":eval("-"+transaction.amount)},
                        $push:{"wallet.transactions":transaction}
                    }
                    ,function(err,result){
                       if(!err){
                           fn({code:200,message:"Money deducted from your wallet Succesfully"})
                       }else{
                            this.getCollectionTolls(function(tolls){
                                tolls.findOne({tollBoothID:transaction.tollBoothID})
                                .then(data=>{
                                    tolls.updateOne({tollBoothID:data.tollBoothID},
                                    {
                                        $inc:{"wallet.walletBalance":eval("-"+transaction.amount)},
                                        $pull:{"wallet.transactions":transaction}
                                    },
                                    function(err,result){
                                        if(err){
                                            
                                        }
                                    });
                                });
                            });        
                           fn({code:404,message:"Unable to pay for toll"+err.message}) 
                       }
                    });
            }else{
                fn({code:404,message:"Error Reaching Database"});
            }
        });
    }

    login(username,password,fn){
        this.getCollectionUser(function(collection){
            if(collection!==null&&collection!==undefined){
                collection.findOne({username:username,password:password})
                .then(data=>{
                    if(data!==null&&data!==undefined){
                        fn({code:200,message:"Login Success",data:data});
                    }else{
                        fn({code:404,message:"Incorrect credentials",data:null});
                    }
                });
            }else{
                fn({code:404,message:"Not able to reach database"});
            }
        });
    }

    getUser(rfidCardNumber,fn){
        this.getCollectionUser(function(collection){
            collection.findOne({rfidCardNumber:rfidCardNumber}).then(data=>{
                if(data!==null&&data!==undefined){
                    fn({code:200,message:"User Found",data:data});
                }else{
                    fn({code:404,message:"User Not Found",data:null});
                }
            });
        });
    }
}

module.exports=DBOperations;