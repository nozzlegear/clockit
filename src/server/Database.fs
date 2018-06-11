module Database 

open Davenport.Fsharp
open System

type UserId = 
    | UserId of string 

let private defaultIdAndRevFields = "id", "rev"
// Must ALWAYS be 'user' when using the _users database. CouchDB does not allow any other variation.
let [<Literal>] private UserTypeName = "user"
let [<Literal>] private SessionTypeName = "Session"
let [<Literal>] private ProjectTypeName = "Project"
let [<Literal>] private MilestoneTypeName = "Milestone"
let [<Literal>] private TaskTypeName = "Task"
let [<Literal>] private SubtaskTypeName = "Subtask"
let [<Literal>] private CommentTypeName = "Comment"
let [<Literal>] private TimeTickTypeName = "TimeTick"

let fieldMap = 
    Map.empty 
    |> Map.add UserTypeName defaultIdAndRevFields
    |> Map.add SessionTypeName defaultIdAndRevFields
    |> Map.add ProjectTypeName defaultIdAndRevFields
    |> Map.add MilestoneTypeName defaultIdAndRevFields
    |> Map.add TaskTypeName defaultIdAndRevFields
    |> Map.add SubtaskTypeName defaultIdAndRevFields
    |> Map.add CommentTypeName defaultIdAndRevFields
    |> Map.add TimeTickTypeName defaultIdAndRevFields

let private db userId = 
    let addUsernameAndPassword client =
        match Constants.couchUsername, Constants.couchPassword with
        | Some u, Some p -> client |> username u |> password p
        | Some u, None -> client |> username u
        | None, Some p -> client |> password p
        | None, None -> client

    let dbName = 
        match userId with 
        | UserId s -> Davenport.Utils.toUserId s

    Constants.couchUrl 
    |> database dbName
    |> addUsernameAndPassword
    |> mapFields fieldMap
    |> warning (printf "[Database] %s")

open Davenport.Types

/// <summary>
/// Wraps an async computation in an Async.Catch and ignores the result if it succeeds or it throws a DavenportException with `StatusCode = 409 (conflict)`, else rethrows the exception.
/// </summary>
let ignoreConflicts =
    Async.Catch
    >> Async.Map (function
        | Choice1Of2 _ -> ()
        | Choice2Of2 (:? DavenportException as exn) when exn.Conflict -> ()
        | Choice2Of2 exn -> raise exn)

/// <summary>
/// Wraps an async computation in an Async.Catch and returns None if the request throws a 404 exception, else throws the exception itself.
/// </summary>
let inline mapNotFound fn =
    fn
    |> Async.Catch
    |> Async.Map (function
        | Choice1Of2 x -> Some x
        | Choice2Of2 (:? DavenportException as exn) when exn.StatusCode = 404 -> None
        | Choice2Of2 exn -> raise exn)

module Projects = 
    open Clockit.Models

    let private listProjectDataViewName = "list-projects"

    let private insertable project: InsertedDocument<ProjectDoc> = (Some ProjectTypeName, project)

    let private toDoc (doc: Document) = 
        match doc.TypeName with 
        | Some ProjectTypeName -> doc.To<ProjectDoc>()
        | Some typeName -> failwithf "Failed to parse document of type \"%s\" to SubscriptionRequest." typeName
        | None -> failwithf "Document did not have a \"type\" property and could not be parsed to SubscriptionRequest. %A" doc.Raw

    let internal views: Views =
        let lineBreak = "\r\n"
        let cases = 
            [
                ProjectTypeName, Some "_id", ProjectDoc.Tag
                MilestoneTypeName, None, MilestoneDoc.Tag 
                TaskTypeName, None, TaskDoc.Tag 
                SubtaskTypeName, None, SubtaskDoc.Tag 
                CommentTypeName, None, CommentDoc.Tag 
                TimeTickTypeName, None, TimeTickDoc.Tag
            ]
            |> List.map (fun (typeName, fieldName, tag) -> 
                // Use doc.projectId as the field name default. All docs, except project itself, have a .projectId field.
                let fieldName = fieldName |> Option.defaultValue "projectId"

                sprintf "case \"%s\":%s\temit([doc.%s, %i, doc.created]);%sbreak;" 
                    typeName 
                    lineBreak
                    fieldName
                    tag
                    lineBreak)
            |> String.concat "\r\n"

        Map.empty
        |> Map.add listProjectDataViewName (
            sprintf """
                function (doc) {
                    switch (doc.type) {
                        %s
                    }
                }
            """ cases,
            None
        )

    let internal indexes = []

    let createProject = db >> fun db projectType name rate description -> async {
        let project: ProjectDoc = {
            id = ""
            rev = ""
            description = description 
            projectType = projectType 
            name = name 
            created = DateTime.UtcNow 
            rate = rate
        }

        let! result = 
            project
            |> insertable
            |> create
            <| db

        return { project with id = result.Id; rev = result.Rev }
    }

    let getProject = db >> fun db id ->
        [
            ListOption.StartKey [id]
            ListOption.EndKey [id]
            ListOption.GroupLevel 1
            ListOption.IncludeDocs true
        ]
        |> view "list" listProjectDataViewName
        <| db
        |> Async.Map (fun r -> r.Rows)
        |> Async.MapList (fun r -> r.Doc |> Option.map toDoc)