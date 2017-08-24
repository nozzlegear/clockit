module MyWebApi.Program

open Suave
open Suave.Successful
open Suave.Filters
open Suave.Operators
open Suave.Redirection
open Davenport

type Punch() =
    inherit Davenport.Entities.CouchDoc ()

let config = Davenport.Configuration("http://localhost:5984", "clockit_punches")
let db = Davenport.Client<Punch>(config)
let createDb =
    db.CreateDatabaseAsync()
    |> Async.AwaitTask
    |> Async.RunSynchronously

if not createDb.Ok then failwith "Failed to create CouchDB database."

let paths: WebPart =
    choose [
        path "/hello" >=> (OK "You're at the /hello path!")
        path "/" >=> (OK "You're on the home page!")
        redirect "/"
    ]

[<EntryPoint>]
let main argv =
    startWebServer defaultConfig paths
    0
