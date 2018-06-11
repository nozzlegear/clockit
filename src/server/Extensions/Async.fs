module Async 

let Map fn computation = async {
    let! result = computation

    return fn result
}

let MapSeq fn = Map (Seq.map fn)

let MapList fn = Map (List.map fn)

let Bind fn computation = async {
    let! result = computation 

    return! fn result
}

let Filter fn (computation: Async<seq<'a>>) = async {
    let! result = computation 

    return Seq.filter fn result
}

let Return v = async { return v }

let TryHead (a: Async<'a seq>) = async {
    let! result = a

    return Seq.tryHead result
}
