import * as dotenv from 'dotenv';
dotenv.config();

import { OpenAIEmbeddings } from "@langchain/openai";
import { Injectable } from "@nestjs/common";
@Injectable()
export class EmbeddingService{
    private readonly embed_model:OpenAIEmbeddings<number[]> = null;
    constructor (){
        if (!this.embed_model){
            this.embed_model = new OpenAIEmbeddings({
                // batchSize:2,
                // dimensions:256,
                model: "text-embedding-ada-002",
            });
        }
    }
    async similarCosineSimilarScore(checkedSentence, correctSentence){
        const [vector1, vector2] = await this.embed_model.embedDocuments([checkedSentence, correctSentence])
        var cosineScore = 0;
        for (let i =0; i < vector1.length; i++) {
            cosineScore+=vector1[i]*vector2[i]
        }
        return cosineScore
    }
}