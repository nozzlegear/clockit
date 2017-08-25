module Clockit.Database

open System
open Davenport
open Clockit.Domain

type PunchViewReturn = {
    total_docs: int
    offset: int
}

type PunchDbFactor() =
    inherit Davenport.Client<Punch>("http://localhost:5984", "clockit_punches")

    let listByStartTimeViewName = "by-starttime"
    let designDocName = "list"

    member x.DesignDocs: Entities.DesignDocConfig list =
    [

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
    let punchDb = PunchDbFactor ()

    if not configured then
        ()

    let t = Davenport.Configuration("", "")
    Davenport.Configuration.ConfigureDatabaseAsync<Punch>()

    return punchDb
}
