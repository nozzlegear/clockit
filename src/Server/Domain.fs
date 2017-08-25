namespace Clockit.Domain

open System
open Davenport

type Punch (startTime, endTime) =
    inherit Davenport.Entities.CouchDoc()
    member x.StartTime: DateTime = startTime
    member x.EndTime: DateTime option = endTime

type Week = {
    Label: string
    Punches: Punch list
}