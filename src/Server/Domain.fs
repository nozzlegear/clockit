namespace Clockit.Domain

open System

type Punch = {
    startTime: DateTime
    endTime: DateTime
}

type Week = {
    label: string
    punches: Punch list
}