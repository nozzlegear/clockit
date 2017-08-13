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
    date: int64;
    length: int;
}

[<Pojo>]
type ClockProps = {
    currentLength: int;
}

[<Pojo>]
type AppState = {
    currentLength: int;
}

let formatTimeDigit digit = if digit < 10 then sprintf "0%i" digit else digit.ToString ()

let formatTimeString length =
    let hourLength = 3600;
    let hours = length / hourLength |> formatTimeDigit
    let minutes = length % hourLength / 60 |> formatTimeDigit
    let seconds = length % hourLength % 60 % 60 |> formatTimeDigit

    sprintf "%s:%s:%s" hours minutes seconds

let Clock (props: ClockProps) = 
    R.h1 [] [ R.str (formatTimeString props.currentLength)]

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
    inherit React.Component<obj,AppState>(props)
    do 
        // TODO: Figure out the current length based on whether the user is punched in or not, and for how long.
        let currentLength = 0;
        base.setInitState({currentLength = currentLength})

    member this.Tick () =
        let state = { this.state with currentLength = this.state.currentLength + 1 }
        
        this.setState state

    member this.componentDidMount (props, state) = 
        let timer = window.setInterval (this.Tick, 1000)

        ignore ()    

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
            R.fn Clock { currentLength = this.state.currentLength } []
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