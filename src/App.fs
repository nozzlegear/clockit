module Clockit
module R = Fable.Helpers.React

open R.Props
open Fable.Core
open Fable.Core.JsInterop
open Fable.Import
open System

[<Pojo>]
type PreviousRecordProps = {
    date: int64;
    length: int;
}

[<Pojo>]
type ClockProps = {
    currentLength: int;
    punchedIn: bool;
}

[<Pojo>]
type ClockState = {
    currentLength: int;
}

let formatTimeDigit digit = if digit < 10 then sprintf "0%i" digit else digit.ToString ()

let formatTimeString length =
    let hourLength = 3600;
    let hours = length / hourLength |> formatTimeDigit
    let minutes = length % hourLength / 60 |> formatTimeDigit
    let seconds = length % hourLength % 60 % 60 |> formatTimeDigit

    sprintf "%s:%s:%s" hours minutes seconds

type Clock(props) =
    inherit React.Component<ClockProps,ClockState>(props)
    do 
        let state = { currentLength = props.currentLength }
        base.setInitState(state)

    member this.componentDidMount (props, state) =
        // TODO: Set a timer to update every 1 second 
        ignore ()

    member this.render () =
        // Todo: state.currentLength is in seconds. Calculate hours, seconds and minutes.
        
        R.h1 [] [ R.str (formatTimeString this.state.currentLength) ]

type ToggleButton(props) =
    inherit React.Component<obj,obj>(props)
    do base.setInitState()

    member this.render () =
        R.div [ Id "toggle-button" ] [
            R.p [] [ R.str "You are not punched in." ]
            R.button [] [R.str "Punch In"]
        ]

type PreviousRecord(props) =
    inherit React.Component<PreviousRecordProps,obj>(props)
    do base.setInitState()

    member this.render () =
        R.div [ClassName "previous-record"] [
            R.div [ClassName "time"] [
                R.str (formatTimeString props.length)
            ]
            R.div [ClassName "date"] [
                R.str ("Aug 08, 2017")
            ]
        ]

type App(props) =
    inherit React.Component<obj,obj>(props)
    do base.setInitState()

    member this.render() =
        let list = [
            {
                date = 1499230800000L
                length = 2267
            }
        ]
        let componentList = 
            list 
            |> Seq.map(fun item ->        
                R.com<PreviousRecord,PreviousRecordProps,_> item []
            ) 
            |> Seq.toList
        R.main [ Id "main" ] [
            R.div [ ] [ 
                R.p [] [R.str "Clockit"]

            ]
            R.com<Clock,ClockProps,_> { currentLength = 71980; punchedIn = false } [ ]
            R.com<ToggleButton,_,_> [] []
            R.div [] componentList
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