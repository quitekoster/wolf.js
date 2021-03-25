export default interface Group {
    base: {
      id: number,
      name: string,
      hash: string,
      description: string,
      reputation: number,
      premium: boolean,
      members: number,
      official: boolean,
      owner: { id: number, hash: string },
      peekable: boolean,
      icon: number
    },
    extended: {
      discoverable: boolean,
      advancedAdmin: boolean,
      locked: boolean,
      questionable: boolean,
      entryLevel: number,
      passworded: boolean,
      language: number,
      id: number
    },
    audioConfig: { 
        id: number, 
        enabled: true, 
        minRepLevel: number, 
        stageId: number
    },
    audioCounts: { 
        id: number, 
        consumerCount: number, 
        broadcasterCount: number 
    }
  }