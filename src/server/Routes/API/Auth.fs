module Clockit.Routes.API.Auth 

open Giraffe
open Giraffe.Core 

let indexHandler = 
    setStatusCode 200 
    >=> text "Hello world!"

let routes: HttpHandler list = 
    [
        GET >=> choose [
            route "/api/v1/auth" >=> indexHandler
        ]
    ]