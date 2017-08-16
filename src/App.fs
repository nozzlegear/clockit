module Clockit
module R = Fable.Helpers.React
module FSOption = FSharp.Core.Option

open R.Props
open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open Fable.Import.Browser
open System

type StartTimeType = StartDate of DateTime | StartDateString of string
type EndTimeType = EndDate of DateTime option | EndDateString of string option

[<Pojo>]
type PreviousRecordProps = {
    // TODO: When stringified to JSON the datetime is converted to a string, but is never converted back to 
    // DateTime when parsed from json. Could probably circumvent this easily by making it a union time of DateTime or string. 
    startTime: StartTimeType
    endTime: EndTimeType
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
    previousPunches: PreviousRecordProps list
}

let inline (/??) x y = if isNull x then y else x

let inline (|?) (a: 'a option) b = if a.IsSome then a.Value else b

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
        | EndDateString s -> 
            match s with 
            | Some s -> DateTime.Parse s
            | None -> DateTime.Now
        | EndDate d ->
            match d with
            | Some d -> d
            | None -> DateTime.Now
    let startTime = 
        match props.startTime with
        | StartDateString s -> DateTime.Parse s
        | StartDate d -> d

    R.div [ClassName "previous-record"] [
        R.div [ClassName "time"] [
            R.str (endTime - startTime |> getDateDifference |> formatTimeString)
        ]
        R.div [ClassName "date"] [
            R.str (startTime.ToString ("D"))
        ]
    ]

[<PassGenerics>]
let load<'T> key: 'T option = 
    !!Browser.localStorage.getItem key
    |> FSOption.map (fun json -> !!ofJson<'T> json)

let save key value =
    Browser.localStorage.setItem (key, toJson value)

let remove key = 
    Browser.localStorage.removeItem key

type App(props) =
    inherit React.Component<obj,AppState>(props)
    do 
        // TODO: Figure out the current length based on whether the user is punched in or not, and for how long.
        let lastPunch = 
            match load<string> App.PunchedInSinceKey with
            | Some s -> Some (DateTime.Parse s)
            | None -> None
        let currentLength = 
            match lastPunch with
            | Some date -> DateTime.Now - date |> getDateDifference
            | None -> 0

        let previousPunches = load<PreviousRecordProps list> App.PreviousPunchesKey |? []

        base.setInitState({currentLength = currentLength; since = lastPunch; previousPunches = previousPunches })

    let mutable timer: float option = None 

    static member PunchedInSinceKey = "clockit_punched_in_since"

    static member PreviousPunchesKey = "clockit_previous_punches"

    member this.Tick () =
        match this.state.since with
        | Some date ->
            // TODO: CurrentLength should add up all previous punchs + current punch.
            // TODO: If the user has been punched in for longer than 12 hours, ask if that's correct.
            let state = { this.state with currentLength = DateTime.Now - date |> getDateDifference }

            this.setState state
        | None -> ()        

    member this.ClearTimer () = 
        match timer with
        | Some t -> window.clearInterval t
        | None -> ()

        timer <- None

    member this.StartTimer () = 
        this.ClearTimer ()

        timer <- Some <| window.setInterval (this.Tick, 1000)
            
    member this.TogglePunch () =
        let newStatus = not this.state.since.IsSome 
        let length = this.state.currentLength

        this.ClearTimer ()

        let newState = { this.state with currentLength = 0 }

        if newStatus then
            let since = DateTime.Now

            save App.PunchedInSinceKey since

            this.setState { newState with since = Some since }
            this.StartTimer ()
        else
            let lastPunchAt = 
                match this.state.since with
                | Some s -> s
                | None -> DateTime.Now.AddHours -8.
            
            // User has punched out, save their current length and remove the punched in localstorage item
            let punches = 
                match load<PreviousRecordProps list> App.PreviousPunchesKey with
                | Some s -> s
                | None -> []
                @ [{startTime = StartDate lastPunchAt; endTime = EndDate <| Some DateTime.Now}]                

            save App.PreviousPunchesKey punches
            remove App.PunchedInSinceKey

            this.setState { newState with since = None; previousPunches = punches }
 
    member this.componentDidMount (props, state) = 
        if this.state.since.IsSome then this.StartTimer()
        
    member this.render() =

        R.main [ Id "main" ] [
            R.h2 [] [R.str "Clockit"]
            (
                match this.state.since.IsSome with
                | true -> R.fn Clock { currentLength = this.state.currentLength } []
                | false -> R.h1 [] [R.str "You are not punched in."]
            )
            R.fn ToggleButton { punchedIn = this.state.since.IsSome; onClick = (fun e -> this.TogglePunch () ) } []
            R.div [] (
                this.state.previousPunches
                |> Seq.map(fun item -> R.fn PreviousRecord item [])
                |> Seq.toList
            )    
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