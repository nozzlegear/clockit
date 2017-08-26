module Clockit.Program

open System
open Suave
open Suave.Successful
open Suave.Filters
open Suave.Operators
open Suave.RequestErrors
open Suave.Redirection

open Newtonsoft.Json
open Clockit.Database
open Clockit.Domain

let createDocRoute (context: HttpContext) = async {
    let newDoc = Punch (DateTime.Now, Some DateTime.Now)
    // let doc = punchDb.PostAsync newDoc

    // return OK <| sprintf "Document %s added to database." newDoc.Id
    return Some context
}

let JSON v =
    let jsonSerializerSettings = JsonSerializerSettings()

    JsonConvert.SerializeObject(v, jsonSerializerSettings) |> OK
    >=> Writers.setMimeType "application/json; charset=utf-8"

let someOtherFunc r =
    match r with
    | Some s -> OK "" >=> Writers.setMimeType "test"
    | None -> BAD_REQUEST "" >=> Writers.setMimeType "test"

let myGetHandler (context: HttpContext) = async {
    return Some "hello"
}

let myPostHandler database (context: HttpContext) = async {
    return Some "test"
}

let Get resourcePath handler =
    GET >=> path resourcePath >=> warbler(handler >> JSON)

let Post resourcePath handler =
    POST >=> path resourcePath >=> warbler(handler >> JSON)

let paths (punchDb: PunchDbFactory): WebPart =
    choose [
        Get "/test" <| myGetHandler
        Post "/punch" <| myPostHandler punchDb
        path "/" >=> Files.browseFileHome "index.html" >=> Writers.setMimeType "text/html"
        // GET >=>
        //     choose [
        //         path "/" >=> Files.browseFileHome "index.html"
        //         path "/test" >=> (fun r -> OK "test")
        //     ]
        // path "/" >=> Files.browseFileHome "index.html"
        // path "/bundle.js" >=> Files.browseFileHome "bundle.js"
        //     >=> Writers.setHeader "Cache-Control" "no-cache, no-store, must-revalidate"
        //     >=> Writers.setHeader "Pragma" "no-cache"
        //     >=> Writers.setHeader "Expires" "0"
        // OK "404 - Not found."
    ]
    // choose [
    //     path "/hello" >=> (OK "You're at the /hello path!")
    //     path "/db" >>= (fun _ -> OK "test")
    //     path "/" >=> (OK "You're on the home page!")
    //     redirect "/"
    // ]

let mainAsync argv = async {
    let! punchDb = configure ()
    startWebServer defaultConfig (paths punchDb)

    return 0
}

[<EntryPoint>]
let main argv =
    mainAsync argv |> Async.RunSynchronously
