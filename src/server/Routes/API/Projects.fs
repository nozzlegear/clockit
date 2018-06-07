module Clockit.Routes.API.Projects 

open Microsoft.AspNetCore.Http
open Giraffe
open Giraffe.Core 

module Database = 
    open Clockit.Models

    let getRandomCompletionDate = 
        let random = System.Random() 
        (fun () -> 
            match random.Next 10 with 
            | i when i <= 3 -> Some System.DateTime.UtcNow
            | _ -> None)

    let getComment parentType parentId id rev: CommentDoc = 
        let comment = 
            match parentType with 
            | CommentParent.Task -> "This is a comment on a Task"
            | CommentParent.Milestone -> "This is a comment on a Milestone"
            | CommentParent.Project -> "This is a comment on a Project"

        { id = id 
          rev = rev
          parentId = parentId
          created = System.DateTime.UtcNow
          parentType = parentType 
          comment = comment }

    let getSubtask taskId id rev: SubtaskDoc =  
        { id = id 
          rev = rev 
          taskId = taskId
          created = System.DateTime.UtcNow
          completedOn = getRandomCompletionDate()
          description = "This is a description of the subtask" }

    let getTask milestoneId id rev: TaskDoc = 
        { id = id 
          rev = rev 
          milestoneId = milestoneId 
          created = System.DateTime.UtcNow 
          name = "Task #something"
          description = "This is a description of the task"
          completedOn = getRandomCompletionDate()
          estimatedHours = 5.5m }

    let getMilestone projectId id rev: MilestoneDoc = 
        { id = id 
          rev = rev 
          projectId = projectId 
          created = System.DateTime.UtcNow 
          name = "Milestone #x" 
          description = "This is a description of the milestone" }

    let getProjectData (): ProjectDoc * ProjectChild list = 
        let guid () = System.Guid.NewGuid() |> string 
        let project = {
            id = guid() 
            rev = guid() 
            description = "This is a description of my project"
            ``type`` = Clockit.Models.ProjectType.Project 
            name = "Eye Supply"
            created = System.DateTime.UtcNow 
            rate = Clockit.Models.Rate.Weekly (10m, 575m)
        }

        let docs: ProjectChild list = 
            [
                getMilestone project.id (guid()) (guid())
                getMilestone project.id (guid()) (guid())
            ]
            |> List.fold (fun state milestone -> 
                let tasks: ProjectChild list = 
                    [
                        getTask milestone.id (guid()) (guid())
                        getTask milestone.id (guid()) (guid())
                        getTask milestone.id (guid()) (guid())
                        getTask milestone.id (guid()) (guid())
                    ]
                    |> List.fold (fun state task -> 
                        let subtasks: ProjectChild list = 
                            [
                                getSubtask task.id (guid()) (guid())
                                getSubtask task.id (guid()) (guid())
                            ]
                            |> List.map ProjectChild.Subtask

                        let comments = 
                            [
                                getComment CommentParent.Task task.id (guid()) (guid())
                                getComment CommentParent.Task task.id (guid()) (guid())
                                getComment CommentParent.Task task.id (guid()) (guid())
                            ]
                            |> List.map ProjectChild.Comment

                        state@[ProjectChild.Task task]@subtasks@comments) []
                
                let comments: ProjectChild list = 
                    [
                        getComment CommentParent.Milestone milestone.id (guid()) (guid())
                        getComment CommentParent.Milestone milestone.id (guid()) (guid())
                    ]
                    |> List.map ProjectChild.Comment
                    
                state@[ProjectChild.Milestone milestone]@tasks@comments) []
        
        let comments: ProjectChild list = 
            [
                getComment CommentParent.Project project.id (guid()) (guid())
                getComment CommentParent.Project project.id (guid()) (guid())
                getComment CommentParent.Project project.id (guid()) (guid())
            ]
            |> List.map ProjectChild.Comment
        
        project, docs@comments

module Utils = 
    open Clockit.Models 

    let getCommentsFor parentId = 
        List.fold (fun state doc -> 
            match doc with 
            | Comment cmt -> 
                match cmt.parentId = parentId with 
                | true -> 
                    let mapped: API.Comment = 
                        { id = cmt.id 
                          rev = cmt.rev 
                          created = cmt.created 
                          comment = cmt.comment }
                    state@[mapped]
                | false ->
                    state
            | _ -> state) []
    
    let getTicksFor taskId = 
        List.fold (fun state doc -> 
            match doc with 
            | TimeTick tick -> 
                match tick.taskId = taskId with 
                | true -> 
                    let mapped: API.TimeTick = 
                        { id = tick.id 
                          rev = tick.rev 
                          started = tick.started 
                          ended = tick.ended }
                    state@[mapped]
                | false -> 
                    state 
            | _ -> state) []

    let getSubtasksFor taskId = 
        List.fold (fun state doc -> 
            match doc with 
            | Subtask sub -> 
                match sub.taskId = taskId with 
                | true -> 
                    let mapped: API.Subtask = 
                        { id = sub.id 
                          rev = sub.rev 
                          created = sub.created 
                          completedOn = sub.completedOn
                          description = sub.description }
                    state@[mapped]
                | false -> 
                    state
            | _ -> 
                state) []

    let getTasksFor milestoneId (docs: ProjectChild list): API.Task list =
        docs 
        |> List.fold (fun state doc -> 
            match doc with
            | Task task -> 
                match milestoneId = task.milestoneId with 
                | true -> 
                    let comments = getCommentsFor task.id docs
                    let subtasks = getSubtasksFor task.id docs
                    let ticks = getTicksFor task.id docs

                    // TODO: loop through each completed tick and use timespans to determine their length,
                    // rounding up to the nearest 15 minute interval. 

                    state@[
                        {
                            id = task.id 
                            rev = task.rev 
                            created = task.created 
                            name = task.name 
                            description = task.description 
                            estimatedHours = task.estimatedHours
                            totalHours = 0m
                            completedOn = task.completedOn
                            comments = comments
                            subtasks = subtasks
                            ticks = ticks
                        }]
                | false -> 
                    state
            | _ -> 
                state ) []

    let getMilestonesFor projectId (docs: ProjectChild list): API.Milestone list = 
        docs 
        |> List.fold (fun state doc -> 
            match doc with 
            | Milestone stone -> 
                match projectId = stone.projectId with 
                | true -> 
                    let comments = getCommentsFor stone.id docs 
                    let tasks = getTasksFor stone.id docs 
                    let estimatedHours, totalHours = 
                        tasks 
                        |> List.fold (fun (estimated, total) task -> 
                            (estimated + task.estimatedHours, total + task.totalHours)) (0m, 0m)
                    let mapped: API.Milestone = 
                        { id = stone.id 
                          rev = stone.rev 
                          name = stone.name 
                          created = stone.created 
                          description = stone.description 
                          estimatedHours = estimatedHours 
                          totalHours = totalHours 
                          comments = comments 
                          tasks = tasks }
                    state@[mapped]
                | false -> 
                    state
            | _ -> 
                state) []

    let mapProject (project: ProjectDoc) (docs: ProjectChild list): API.Project = 
        let comments = getCommentsFor project.id docs 
        let milestones = getMilestonesFor project.id docs 
        let estimatedHours, totalHours = 
            milestones
            |> List.fold (fun (estimated, total) task -> 
                (estimated + task.estimatedHours, total + task.totalHours)) (0m, 0m)
        let typeStr = 
            match project.``type`` with 
            | ProjectType.Estimate -> "Estimate"
            | ProjectType.Project -> "Project"
        let rate: API.Rate =    
            match project.rate with 
            | Flat value -> { period = "Flat"; value = value }
            | Hourly value -> { period = "Hourly"; value = value }
            | Daily (_, value) -> { period = "Daily"; value = value }
            | Weekly (_, value) -> { period = "Weekly"; value = value }
            | Monthly (_, value) -> { period = "Monthly"; value = value }

        { id = project.id 
          rev = project.rev
          description = project.description 
          rate = rate 
          name = project.name
          created = project.created 
          ``type`` = typeStr
          milestones = milestones
          comments = comments 
          estimatedHours = estimatedHours
          totalHours = totalHours }

let private notFound resourceId: HttpHandler = 
    let message: Clockit.Models.API.ErrorMessage = {
        message = Some (sprintf "Could not find a resource with the id %s" resourceId)
        statusCode = 404
        statusDescription = "Not Found"
    }

    setStatusCode 404 
    >=> json message

let listProjects next ctx = task {
    let project = 
        Database.getProjectData()
        ||> Utils.mapProject

    return! json [project] next ctx
}

let listMilestones projectId next ctx = task {
    let _, docs = Database.getProjectData() 
    let milestones = Utils.getMilestonesFor projectId docs 

    return! 
        match List.isEmpty milestones with 
        | true -> notFound projectId next ctx 
        | false -> json milestones next ctx
}

let listTasks (_, milestoneId) next ctx = task {
    let _, docs = Database.getProjectData() 
    let tasks = Utils.getTasksFor milestoneId docs 

    return! 
        match List.isEmpty tasks with 
        | true -> notFound milestoneId next ctx 
        | false -> json tasks next ctx 
}

let listSubtasks (_, _, taskId) next ctx = task {
    let _, docs = Database.getProjectData() 
    let subtasks = Utils.getSubtasksFor taskId docs 

    return! 
        match List.isEmpty subtasks with 
        | true -> notFound taskId next ctx 
        | false -> json subtasks next ctx
} 

let listComments parentType parentId next ctx = task {
    let _, docs = Database.getProjectData()
    let comments = Utils.getCommentsFor parentId docs 

    return! 
        match List.isEmpty comments with 
        | true -> notFound parentId next ctx 
        | false -> json comments next ctx 
}

let routes: HttpHandler list = 
    [
        GET >=> choose [
            routef "/api/v1/projects/%s/milestones/%s/tasks/%s/subtasks" listSubtasks
            routef "/api/v1/projects/%s/milestones/%s/tasks" listTasks
            routef "/api/v1/projects/%s/milestones" listMilestones
            route  "/api/v1/projects" >=> listProjects
            routef "/api/v1/projects/%s/milestones/%s/tasks/%s/comments" (fun (_, _, taskId) -> listComments Clockit.Models.CommentParent.Task taskId)
            routef "/api/v1/projects/%s/milestones/%s/comments" (fun (_, milestoneId) -> listComments Clockit.Models.CommentParent.Milestone milestoneId)
            routef "/api/v1/projects/%s/comments" (listComments Clockit.Models.CommentParent.Project)
        ]
    ]