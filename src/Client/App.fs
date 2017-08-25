module Clockit
module R = Fable.Helpers.React
module FSOption = FSharp.Core.Option

open R.Props
open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open Fable.Import.Browser
open System
open Clockit.Domain

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
    currentPeriodPunches: Punch list
    previousWeeks: Week list
    loading: bool
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
        | Some d -> d
        | None -> DateTime.Now

    R.div [ClassName "previous-record"] [
        R.div [ClassName "time"] [
            R.str (endTime - props.startTime |> getDateDifference |> formatTimeString)
        ]
        R.div [ClassName "date"] [
            R.str (props.startTime.ToString ("D"))
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

        base.setInitState
            {
                loading = true
                currentLength = currentLength
                since = lastPunch
                currentPeriodPunches = []
                previousWeeks = []
            }

    let mutable timer: float option = None

    static member PunchedInSinceKey = "clockit_punched_in_since"

    static member PreviousPunchesKey = "clockit_previous_punches"

    member this.CalculateTotalTime (since: DateTime option) (previousPunches: Punch list) =
        let totalPreviousTime =
            previousPunches
            |> Seq.sumBy (fun punch -> getDateDifference <| punch.endTime - punch.startTime)
        let currentTime =
            match this.state.since with
            | Some s -> getDateDifference <| DateTime.Now - s
            | None -> 0

        totalPreviousTime + currentTime

    member this.Tick () =
        match this.state.since with
        | Some date ->
            // TODO: If the user has been punched in for longer than 12 hours, ask if that's correct.
            let total = this.CalculateTotalTime this.state.since this.state.currentPeriodPunches
            let state = { this.state with currentLength = total }

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

            // TODO: Post new punch to the server
        else
            let lastPunchAt =
                match this.state.since with
                | Some s -> s
                | None -> DateTime.Now.AddHours -8.

            // User has punched out, save their current length and remove the punched in localstorage item
            let punches =
                this.state.currentPeriodPunches
                @ [{startTime = lastPunchAt; endTime = DateTime.Now}]

            save App.PreviousPunchesKey punches
            remove App.PunchedInSinceKey

            this.setState { newState with since = None; currentPeriodPunches = punches }

            // TODO: Post punch out to the server

    member this.componentDidMount (props, state) =
        if this.state.since.IsSome then this.StartTimer()

        window.setTimeout ((fun _ ->
            // TODO: Load punches from server
            let previousPunches = load<Punch list> App.PreviousPunchesKey |? []
            let previousWeeks = [
                {
                    label = "Week of August 13th"
                    punches =
                    [
                        {
                            startTime = DateTime.Parse("2017-08-14 12:00:00")
                            endTime = DateTime.Parse("2017-08-14 15:05:00")
                        }
                    ]
                }
                {
                    label = "Week of August 6th"
                    punches =
                    [
                        {
                            startTime = DateTime.Parse("2017-08-06 12:00:00")
                            endTime = DateTime.Parse("2017-08-06 22:00:00")
                        }
                    ]
                }
            ]
            let currentTime = this.CalculateTotalTime this.state.since previousPunches

            this.setState {
                this.state with
                    currentPeriodPunches = previousPunches
                    previousWeeks = previousWeeks
                    currentLength = currentTime
                    loading = false
            }
        ), 1000)

    member this.render() =

        R.main [ Id "main" ] [
            R.h2 [] [R.str "Clockit"]
            (
                match this.state.since.IsSome with
                | true -> R.fn Clock { currentLength = this.state.currentLength } []
                | false -> R.h1 [] [R.str "You are not punched in."]
            )
            R.fn ToggleButton { punchedIn = this.state.since.IsSome; onClick = (fun e -> this.TogglePunch () ) } []
            (
                match this.state.loading with
                | true ->
                    R.div [Id "loading-message"] [
                        R.progress [] []
                        R.p [] [
                            R.str "Loading previous hours, please wait."
                        ]
                    ]
                | false ->
                    R.div [] (
                        this.state.currentPeriodPunches
                        |> Seq.map(fun item -> { startTime = item.startTime; endTime = Some item.endTime })
                        |> Seq.append (
                            match this.state.since with
                            | Some since -> [{ startTime = since; endTime = None }]
                            | None -> [])
                        |> Seq.sortBy(fun props -> props.startTime)
                        |> Seq.rev
                        |> Seq.map(fun props -> R.fn PreviousRecord props [])
                        |> Seq.toList
                    )
            )
            R.h2 [] [R.str "Previous Weeks"]
            R.p [] [R.str "Previous five weeks go here."]
            R.div [] (
                this.state.previousWeeks
                |> Seq.map(fun week ->
                    R.div [Key week.label; ClassName "previous-week"] [
                        R.div [ClassName "label"] [ R.str week.label ]
                        R.div [ClassName "length"] [ R.str (week.punches |> Seq.sumBy (fun punch -> punch.endTime - punch.startTime |> getDateDifference) |> formatTimeString) ]
                    ])
                |> Seq.toList
            )
            R.p [] [
                R.a [Href "/more"] [R.str "More"]
            ]
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