module Clockit
module R = Fable.Helpers.React

open R.Props
open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open Fable.Import.Browser
open System

[<Pojo>]
type PreviousRecordProps = {
    startTime: DateTime
    endTime: DateTime option
}

[<Pojo>]
type ClockProps = {
    currentLength: int
}

[<Pojo>]
type ToggleButtonProps = {
    punchedIn: bool
    onClick: React.MouseEvent -> unit
}

[<Pojo>] 
type AppState = {
    currentLength: int
    since: DateTime option
    punchedIn: bool
    previousPunches: PreviousRecordProps list
}

let getDateDifference (difference: TimeSpan) = int <| Math.Ceiling difference.TotalSeconds

let formatTimeDigit digit = if digit < 10 then sprintf "0%i" digit else digit.ToString ()

let formatTimeString length =
    let hourLength = 3600
    let hours = length / hourLength |> formatTimeDigit
    let minutes = length % hourLength / 60 |> formatTimeDigit
    let seconds = length % hourLength % 60 % 60 |> formatTimeDigit

    sprintf "%s:%s:%s" hours minutes seconds

let Clock (props: ClockProps) = 
    R.h1 [] [ R.str (formatTimeString props.currentLength)]

let ToggleButton (props: ToggleButtonProps) = 
    let text = 
        match props.punchedIn with
        | true ->
            "Punch Out"
        | false ->
            "Punch In"

    R.button [Id "toggle-button"; OnClick props.onClick ] [R.str text]

let PreviousRecord (props: PreviousRecordProps) =
    let endTime = 
        match props.endTime with
        | Some v -> v
        | None -> DateTime.Now

    R.div [ClassName "previous-record"] [
        R.div [ClassName "time"] [
            R.str (endTime - props.startTime |> getDateDifference |> formatTimeString)
        ]
        R.div [ClassName "date"] [
            R.str (props.startTime.ToString ("D"))
        ]
    ]

type App(props) =
    inherit React.Component<obj,AppState>(props)
    do 
        // TODO: Figure out the current length based on whether the user is punched in or not, and for how long.
        let lsValue = window.localStorage.getItem App.PunchedInSinceKey
        let parsedValue = 
            match lsValue with
            | :? String as s ->
                match box (ofJson s) with
                | :? String as dateString ->
                    printfn "String value was %s" dateString
                    Some <| DateTime.Parse dateString
                | :? int64 as timestamp ->
                    Some <| DateTime timestamp                                
                | _ -> 
                    printfn "Could not parse localstorage value %A to DateTime" lsValue
                    
                    None                
            | _ -> None
        let currentLength = 
            match parsedValue with
            | Some date -> 
                DateTime.Now - date |> getDateDifference
            | None -> 0
        let previousPunches = [
            {
                startTime = DateTime.Parse("2017-08-12T00:12:00.000Z")
                endTime = Some (DateTime.Parse "2017-08-12T00:13:00.000Z")
            }
            {
                startTime = DateTime.Parse("2017-08-11T00:12:00.000Z")
                endTime = Some (DateTime.Parse "2017-08-11T00:14:00.000Z")
            }
        ]

        base.setInitState({currentLength = currentLength; punchedIn = parsedValue.IsSome; since = parsedValue; previousPunches = previousPunches })

    let mutable timer: float option = None 

    static member PunchedInSinceKey = "clockit_punched_in_since"

    member this.Tick () =
        match this.state.since with
        | Some date ->
            // TODO: CurrentLength should add up all previous punchs + current punch.
            // TODO: If the user has been punched in for longer than 12 hours, ask if that's correct.
            let state = { this.state with currentLength = DateTime.Now - date |> getDateDifference }

        
            this.setState state
        | None -> ignore ()        

    member this.ClearTimer () = 
        match timer with
        | Some t -> window.clearInterval t
        | None -> ignore ()

        timer <- None

    member this.StartTimer () = 
        this.ClearTimer ()

        timer <- Some <| window.setInterval (this.Tick, 1000)
            
    member this.TogglePunch () =
        let status = not this.state.punchedIn 
        let length = this.state.currentLength

        this.ClearTimer ()

        let since = 
            match status with 
            | true -> 
                let value = DateTime.Now

                window.localStorage.setItem (App.PunchedInSinceKey, toJson value)

                Some value
            | false -> 
                // User has punched out, save their current length and remove the punched in localstorage item
                window.localStorage.setItem ("item", toJson [this.state])
                window.localStorage.removeItem App.PunchedInSinceKey
                
                None

        let state = { this.state with punchedIn = status; currentLength = 0; since = since  }
        
        this.setState state

        match since with
        | Some v -> this.StartTimer ()
        | None -> ignore ()

    member this.componentDidMount (props, state) = 
        match this.state.punchedIn with
        | true -> this.StartTimer ()
        | false -> ignore ()         

    member this.render() =
        let previousHours = 
            this.state.previousPunches
            |> Seq.map(fun item -> 
                R.fn PreviousRecord item []       
            ) 
            |> Seq.toList

        R.main [ Id "main" ] [
            R.h2 [] [R.str "Clockit"]
            (
                match this.state.punchedIn with
                | true -> R.fn Clock { currentLength = this.state.currentLength } []
                | false -> R.h1 [] [R.str "You are not punched in."]
            )
            R.fn ToggleButton { punchedIn = this.state.punchedIn; onClick = (fun e -> this.TogglePunch () ) } []
            R.div [] previousHours
        ]

let init() =
    let container = Browser.document.getElementById "content-host"
    let render() = 
        ReactDom.render(
            R.com<App,_,_> [] [],
            container
        )

    render()    

init()