const MongoClient=require('mongodb').MongoClient;
const url='mongodb://shivani:shivani123@ds123196.mlab.com:23196/rfid-db';
const client=new MongoClient(url,{useNewUrlParser:true});

const nodemailer=require('nodemailer');
const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:"platedrestaurants@gmail.com",
        pass:"9826855195"
    }
});

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
                console.log(newUser);
                //Refactoring Needed add conditions
                collection.findOne({rfidCardNumber:newUser.rfidCardNumber},function(err,data1){
                    console.log(data1);
                    if(data1!==null&&data1.rfidCardNumber===newUser.rfidCardNumber){
                        console.log(data1);
                        fn({code:404,message:"RFID already exists."});
                    }else{
                        collection.findOne({username:newUser.username},function(err,data2){
                            if(data2!==null&&data2.username===newUser.username){
                                fn({code:404,message:"Username already exists."});
                            }else{
                                collection.findOne({drivingLicenseNumber:newUser.drivingLicenseNumber},function(err,data3){
                                    if(data3!==null&&data3.drivingLicenseNumber===newUser.drivingLicenseNumber){
                                        fn({code:404,message:"Driving License already exists."});
                                    }else{
                                        collection.insertOne(newUser,function(err,result){
                                            //console.log(result);
                                            if(!err){
                                                fn({code:200,message:"User Created Successfully"});
                                            }else{
                                                fn({code:404,message:"Unable To Create User"});
                                            }
                                        });
                                    }
                                });
                            }
                        });
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
                            var data=collection.findOne({rfidCardNumber:rfidCardNumber},function(err,result){
                                const mailOptions = {
                                    from: 'platedrestaurants@gmail.com', // sender address
                                    to: data.emailAddress, // list of receivers
                                    subject: "Ditto : Amount Credited",
                                    text:'Hi User,\n\nA amount of '+data.amount+" was credited to your ditto toll account\nRegards\nDitto Team",// plain text body
                                };
                                transporter.sendMail(mailOptions, function (err, info) {
                                    if(err)
                                    console.log(err)
                                    else
                                    console.log(info);
                                });
                            });
                            fn({code:200,message:"Money added to your wallet Succesfully"});
                       }else{
                            fn({code:404,message:"Unable to add money to your wallet"+err.message}) ;
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
        
        //Update User Account
        this.getCollectionUser(function(collection){
            
            if(collection!==null&&collection!==undefined)
            {
                transaction.transactionType="Debit";
                collection.findOne({rfidCardNumber:rfidCardNumber},function(er,result){
                    if(result==null||result==undefined){
                        fn({code:404,message:"Account Not Found"});
                    }else{
                        if(result.wallet.walletBalance>transaction.amount){
                            collection.updateOne({rfidCardNumber:rfidCardNumber},
                            {
                                $inc:{"wallet.walletBalance":eval("-"+transaction.amount)},
                                $push:{"wallet.transactions":transaction}
                            }
                            ,function(err,result){
                                if(err){
                                    fn({code:404,message:"Database Error Occoured."})
                                }
                                else if(result.modifiedCount>0){
                                    collection.findOne({rfidCardNumber:rfidCardNumber},function(err,result){
                                        const mailOptions = {
                                            from: 'platedrestaurants@gmail.com', // sender address
                                            to: result.emailAddress, // list of receivers
                                            subject: "Ditto : Amount Debited",
                                            text:'Hi User,\n\nA amount of '+transaction.amount+" was debited from your ditto toll account\nRegards\nDitto Team", // Subject line// plain text body
                                        };
                                        transporter.sendMail(mailOptions, function (err, info) {
                                            if(err)
                                            console.log(err)
                                            else
                                            console.log(info);
                                        });
                                    });
                                    fn({code:200,message:"Money deducted from your wallet Succesfully"});
                                }else{
                                    fn({code:404,message:"Update count is 0"});
                                }
                            });  
                        }else{
                            console.log("Result amount is"+result.amount)
                            fn({code:404,message:"Insufficient Balance"});
                        }
                    }
                });
                
            }else{
                fn({code:404,message:"Error Reaching Database"});
            }
        });

        // //Update Toll Account
        // this.getCollectionTolls(function(tolls){
        //     // if(tolls!=null&&tolls!=undefined){
        //     //     tolls.findOne({tollBoothID:transaction.tollBoothID})
        //     //     .then(data=>{
        //     //         tolls.updateOne({tollBoothID:data.tollBoothID},
        //     //         {
        //     //             $inc:{"wallet.walletBalance":eval(transaction.amount)},
        //     //             $push:{"wallet.transactions":transaction}    
        //     //         },
        //     //         function(err,result){
        //     //             if(err){
        //     //                 fn({code:404,message:"Unable to pay for toll"+err.message}) 
        //     //             }
        //     //             else if(result.modifiedCount>0){
                            
        //     //             }
        //     //         });
        //     //     });
        //     // }
        //     if(tolls!==null&&tolls!==undefined)
        //     {
        //         transaction.transactionType="Credit";
        //         tolls.findOne({tollBoothID:transaction.tollBoothID},function(er,result){
        //             if(result==null||result==undefined){
        //                 fn({code:404,message:"Toll Account Not Found"});
        //             }else{
                        
        //                 tolls.updateOne({tollBoothID:transaction.tollBoothID},
        //                 {
        //                     $inc:{"wallet.walletBalance":eval(transaction.amount)},
        //                     $push:{"wallet.transactions":transaction}
        //                 }
        //                 ,function(err,result){
        //                     if(err){
        //                         fn({code:404,message:"Database Error Occoured."})
        //                     }
        //                     else if(result.modifiedCount>0){
        //                         fn({code:200,message:"Money deducted from your wallet Succesfully"});
        //                     }else{
        //                         fn({code:404,message:"Update count is 0"});
        //                     }
        //                 });  
        //             }
        //         });
                
        //     }else{
        //         fn({code:404,message:"Error Reaching Database"});
        //     }
        // });

        
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
