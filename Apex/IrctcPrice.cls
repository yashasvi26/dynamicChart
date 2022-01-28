public with sharing class IrctcPrice {
    public IrctcPrice() {

    }

    @AuraEnabled(cacheable = true)
    public static List<IRCTC__c> getIrctcPrice(){
        try {
            return [Select Id, Name, Price__c, CreatedDate
                    from IRCTC__c 
                    where CreatedDate = TODAY 
                    order by CreatedDate ASC
                    ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
