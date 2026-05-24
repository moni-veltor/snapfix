# Multi-tenant + auth

`Organization` is the tenant. Every business row carries an `orgId` and is scoped to its org by `requireOrgRole` (see [Auth & permissions](../architecture/auth-and-permissions.md)). Auth itself sits on NextAuth v4 with the `Account` / `Session` / `VerificationToken` triad.

`Department` and `OrganizationRole` model the org chart: departments own IBSs end-to-end; roles carry an SMF flag and a deputy-of self-relation so the firm's accountability mapping is first-class. `OrganizationRole.defaultHolderId` lets the exercise wizard's SMF quick-add slot the obvious person into a seat with one click.

`Invitation` is an email + token + role; `AchievementUnlock` is the lightweight engagement layer (admin first-runs, first-exercise-completed, etc.).

## Diagram

![Multi-tenant + auth ERD](img/multi-tenant.svg)

## Source

```puml
@startuml multi-tenant
hide circle
hide methods
skinparam linetype ortho
skinparam shadowing false
skinparam defaultFontName "Inter, system-ui, sans-serif"
skinparam ArrowColor #6366F1
skinparam entity {
  BackgroundColor #FFFFFF
  BorderColor #C7D2FE
  HeaderBackgroundColor #EEF2FF
  HeaderFontColor #3730A3
  FontColor #0F172A
  AttributeFontColor #475569
  AttributeFontSize 11
}

title <font color=#3730A3>**Multi-tenant + auth**</font>

entity "Organization" as Org {
  *id : string
  --
  name : string
  slug : string?
  accentHex : string?
  sectorTaxonomy : string?
  createdAt : DateTime
}

entity "Department" as Dept {
  *id : string
  --
  *orgId : string
  name : string
  description : string?
}

entity "OrganizationRole" as Role {
  *id : string
  --
  *orgId : string
  abbreviation : string
  title : string
  responsibility : string?
  isSMF : boolean
  deputyOfRoleId : string?
  defaultHolderId : string?
}

entity "User" as User {
  *id : string
  --
  *orgId : string?
  email : string
  name : string?
  orgRole : enum
  departmentId : string?
  emailVerified : DateTime?
}

entity "Invitation" as Invite {
  *id : string
  --
  *orgId : string
  email : string
  token : string
  orgRole : enum
  status : enum
  expiresAt : DateTime
  acceptedById : string?
}

entity "Account" as Acct {
  *id : string
  --
  *userId : string
  provider : string
  providerAccountId : string
}

entity "Session" as Sess {
  *id : string
  --
  *userId : string
  sessionToken : string
  expires : DateTime
}

entity "VerificationToken" as Vt {
  *identifier : string
  *token : string
  expires : DateTime
}

entity "AchievementUnlock" as Ach {
  *id : string
  --
  *orgId : string
  *userId : string?
  code : string
  unlockedAt : DateTime
}

Org ||--o{ Dept
Org ||--o{ Role
Org ||--o{ User
Org ||--o{ Invite
Org ||--o{ Ach

Dept ||--o{ User
Role }o--o| User : "default holder"
Role |o--o| Role : "deputy of"

User ||--o{ Acct
User ||--o{ Sess
User ||--o{ Ach

note right of Org
  The Organization row is
  the tenant. orgId is on
  every business row; auth
  middleware (requireOrgRole)
  scopes every query.
end note

@enduml
```

Canonical source: [`src/multi-tenant.puml`](src/multi-tenant.puml).
