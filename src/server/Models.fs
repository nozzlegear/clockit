namespace Clockit.Models

open System

[<CLIMutable>]
type Message =
    {
        Text : string
    }

type LengthInHours = decimal

type RateValue = decimal

type Rate = 
    | Hourly of RateValue
    | Daily of LengthInHours * RateValue
    | Weekly of LengthInHours * RateValue
    | Monthly of LengthInHours * RateValue
    | Flat of decimal

type ProjectType = 
    | Estimate 
    | Project

type ProjectDoc = {
    id: string 
    rev: string 
    description: string option
    projectType: ProjectType
    name: string 
    created: DateTime 
    rate: Rate
} with static member Tag = 0

type MilestoneDoc = {
    id: string
    rev: string
    projectId: string
    name: string
    created: DateTime
    description: string
} with static member Tag = 1

type TaskDoc = {
    id: string 
    rev: string 
    projectId: string
    milestoneId: string
    created: DateTime
    name: string
    description: string
    estimatedHours: decimal 
    completedOn: DateTime option
} with static member Tag = 2

type SubtaskDoc = {
    id: string 
    rev: string 
    projectId: string
    taskId: string
    created: DateTime 
    completedOn: DateTime option
    description: string
} with static member Tag = 3

type CommentParent = 
    | Task 
    | Milestone
    | Project

type CommentDoc = {
    id: string 
    rev: string 
    projectId: string
    parentId: string
    created: DateTime
    parentType: CommentParent
    comment: string
} with static member Tag = 4

type TimeTickDoc = {
    id: string
    rev: string
    projectId: string
    taskId: string
    started: DateTime
    ended: DateTime option
} with static member Tag = 5

type ClientDoc = {
    id: string 
    rev: string 
    created: DateTime
    name: string
    email: string
    password: string
    projects: string list
}

type ProjectChild = 
    | Milestone of MilestoneDoc 
    | Task of TaskDoc 
    | Subtask of SubtaskDoc 
    | Comment of CommentDoc 
    | TimeTick of TimeTickDoc 
    | Client of ClientDoc

module API = 
    type ErrorMessage = {
        message: string option 
        statusCode: int 
        statusDescription: string
    }
    
    type Comment = {
        id: string 
        rev: string 
        created: DateTime 
        comment: string
    }

    type Subtask = {
        id: string 
        rev: string 
        created: DateTime 
        completedOn: DateTime option 
        description: string
    }

    type TimeTick = {
        id: string 
        rev: string
        started: DateTime
        ended: DateTime option
    }

    type Task = {
        id: string
        rev: string
        created: DateTime
        name: string
        description: string
        estimatedHours: decimal
        totalHours: decimal
        completedOn: DateTime option
        comments: Comment list
        subtasks: Subtask list
        ticks: TimeTick list
    }

    type Milestone = {
        id: string
        rev: string
        name: string
        created: DateTime
        description: string
        estimatedHours: decimal
        totalHours: decimal
        comments: Comment list
        tasks: Task list
    }

    type Rate = {
        period: string 
        value: decimal
    }

    type Project = {
        id: string 
        rev: string 
        description: string 
        ``type``: string 
        name: string 
        created: DateTime 
        rate: Rate 
        milestones: Milestone list
        comments: Comment list
        estimatedHours: decimal
        totalHours: decimal
    }