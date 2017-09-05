module Clockit.Database

open System
open Davenport
open Clockit.Domain

let private view name map (reduce: string option) =
    let view = Entities.View ()
    view.Name <- name
    view.MapFunction <- map

    reduce |> Option.iter(fun s -> view.MapFunction <- s)

    view

let private designDoc name views =
    let doc = Entities.DesignDocConfig()
    doc.Name <- name
    doc.Views <- views

    doc

type PunchViewReturn = {
    total_docs: int
    offset: int
    docs: Punch list
}

type PunchDbFactory() =
    inherit Davenport.Client<Punch>("http://localhost:5984", PunchDbFactory.DatabaseName)

    static let listByStartTimeViewName = "by-starttime"
    static let designDocName = "list"

    static member DatabaseName = "clockit_punches"

    static member DesignDocs: Entities.DesignDocConfig list =
        [
            designDoc designDocName [
                view
                    listByStartTimeViewName
                    "function (doc) { emit(doc.StartTime) }"
                    None
            ]
        ]

    member x.ListDocsByStartTime (startTime: DateTime option) = async {
        let options = Davenport.Entities.ViewOptions ()

        match startTime with
        | Some s -> options.StartKey <- s
        | None -> ()

        let! result =
            x.ViewAsync<PunchViewReturn>(designDocName, listByStartTimeViewName, options)
            |> Async.AwaitTask
        let list =
            result
            |> Seq.cast<Entities.ViewResult<PunchViewReturn>>

        return list
    }

let mutable private configured = false

let configure () = async {
    if not configured then
        let config = Davenport.Configuration("http://localhost:5984", PunchDbFactory.DatabaseName)
        let! client =
            Davenport.Configuration.ConfigureDatabaseAsync<Punch>(config, null, PunchDbFactory.DesignDocs)
            |> Async.AwaitTask
        ()

    return PunchDbFactory ()
}
