module Clockit.Program

open System
open Suave
open Suave.Successful
open Suave.Filters
open Suave.Operators
open Suave.Redirection
open Clockit.Database
open Clockit.Domain

let createDocRoute (context: HttpContext) = async {
    let newDoc = Punch (DateTime.Now, Some DateTime.Now)
    // let doc = punchDb.PostAsync newDoc

    // return OK <| sprintf "Document %s added to database." newDoc.Id
    return Some context
}

let sleep milliseconds message: WebPart =
  fun (x : HttpContext) ->
    async {
      do! Async.Sleep milliseconds
      return! OK message x
    }

let paths (punchDb: PunchDbFactory): WebPart =
    choose [
        path "/hello" >=> (OK "You're at the /hello path!")
        path "/db" >=> createDocRoute
        path "/" >=> (OK "You're on the home page!")
        redirect "/"
    ]

let mainAsync argv = async {
    let! punchDb = configure ()
    startWebServer defaultConfig (paths punchDb)

    return 0
}

[<EntryPoint>]
let main argv =
    mainAsync argv |> Async.RunSynchronously
